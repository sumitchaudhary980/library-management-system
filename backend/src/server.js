const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const {startFineCron} = require("./jobs/fineCron");
const { createClient } = require("@libsql/client");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

require("./config/initDb");

if (process.env.NODE_ENV !== "production") {
  startFineCron();
}

const pageRoute = require("./routes/pageRoute");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const rateLimiter = require("./middleware/rateLimiter");
const cronRoute = require("./routes/cronRoute");

const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;

const frontendPath = path.join(__dirname, "../../frontend");
const DEFAULT_APP_URL = "http://localhost:3000";

const getBaseUrl = (req) => {
  const configuredUrl = process.env.APP_URL || DEFAULT_APP_URL;

  if (configuredUrl && !configuredUrl.includes("localhost")) {
    return configuredUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

const noindexPrivateSurfaces = (req, res, next) => {
  const publicPaths = new Set(["/", "/robots.txt", "/sitemap.xml", "/favicon.ico"]);
  const isStaticAsset =
    req.path.startsWith("/assets/") ||
    req.path.startsWith("/errors/error.css");

  if (!publicPaths.has(req.path) && !isStaticAsset) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  next();
};

let sessionStore;

if (process.env.NODE_ENV === "production") {

  const sessionDB = createClient({
    url: process.env.TURSO_SESSION_DATABASE_URL,
    authToken: process.env.TURSO_SESSION_AUTH_TOKEN,
  });
  sessionStore = new session.Store();

  sessionStore.get = async (sid, callback) => {
    try {
      const result = await sessionDB.execute({
        sql: "SELECT sess FROM sessions WHERE sid = ?",
        args: [sid],
      });

      if (!result.rows.length) {
        return callback(null, null);
      }

      callback(null, JSON.parse(result.rows[0].sess));

    } catch (err) {
      callback(err);
    }
  };


  sessionStore.set = async (sid, sess, callback) => {
    try {
      const expires = sess.cookie.expires
        ? new Date(sess.cookie.expires).toISOString()
        : null;


      await sessionDB.execute({
        sql: `
          INSERT INTO sessions (sid, sess, expire)
          VALUES (?, ?, ?)
          ON CONFLICT(sid)
          DO UPDATE SET 
          sess = excluded.sess,
          expire = excluded.expire
        `,
        args: [
          sid,
          JSON.stringify(sess),
          expires,
        ],
      });


      callback(null);

    } catch (err) {
      callback(err);
    }
  };


  sessionStore.destroy = async (sid, callback) => {
    try {

      await sessionDB.execute({
        sql: "DELETE FROM sessions WHERE sid = ?",
        args: [sid],
      });

      callback(null);

    } catch (err) {
      callback(err);
    }
  };


  console.log("Using Turso session store");


} else {


  const sessionPath = path.join(__dirname, "database");


  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, {
      recursive: true,
    });
  }


  sessionStore = new SQLiteStore({
    db: "sessions.sqlite",
    dir: sessionPath,
  });


  console.log("Using SQLite session store");

}


app.use(noindexPrivateSurfaces);
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],

        scriptSrcAttr: [
          "'unsafe-inline'"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "data:"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ],

        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],

        formAction: [
          "'self'",
          "https://rc-epay.esewa.com.np",
          "https://epay.esewa.com.np"
        ]
      }
    }
  })
);



app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use(cookieParser());


// API limiter

app.use("/api", rateLimiter);
// SESSION

app.use(
  session({

    name: "sid",

    store: sessionStore,

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {

      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge:
        1000 * 60 * 60 * 24 * 7,

    },

  })
);



// STATIC FILES

app.get("/favicon.ico", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=2592000");
  res.sendFile(path.join(frontendPath, "assets", "favicon", "favicon.ico"));
});

app.get("/robots.txt", (req, res) => {
  const baseUrl = getBaseUrl(req);

  res.type("text/plain");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send([
    "User-agent: *",
    "Allow: /$",
    "Allow: /assets/",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /api",
    "Disallow: /home",
    "Disallow: /books",
    "Disallow: /authors",
    "Disallow: /genres",
    "Disallow: /readers",
    "Disallow: /fines",
    "Disallow: /profile",
    "Disallow: /borrowed-books",
    "Disallow: /borrow-history",
    "Disallow: /forgot-password",
    "Disallow: /reset-password",
    "Disallow: /change-password",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n"));
});

app.get("/sitemap.xml", (req, res) => {
  const baseUrl = getBaseUrl(req);

  res.type("application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);
});

app.use(
  "/assets",
  express.static(
    path.join(frontendPath, "assets"),
    {
      etag: true,
      maxAge: "7d",
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=604800");
      },
    }
  )
);


app.use(
  "/errors",
  express.static(
    path.join(frontendPath, "errors"),
    {
      etag: true,
      maxAge: "1d",
    }
  )
);



// ROUTES
app.use("/api/cron", cronRoute);

app.use("/", pageRoute);

app.use("/api/auth", authRoute);

app.use("/api/admin", adminRoute);

app.use("/api/user", userRoute);




// 404

app.use((req, res) => {

  if (req.originalUrl.startsWith("/api")) {

    return res.status(404).json({
      message: "Resource not found",
    });

  }


  res.status(404).sendFile(
    path.join(frontendPath, "errors", "404.html")
  );

});




// ERROR HANDLER

app.use((err, req, res, next) => {

  console.error(err);

  // Prevent "Cannot set headers after they are sent"
  if (res.headersSent) {
    return next(err);
  }


  const status = err.status || 500;


  if (req.originalUrl.startsWith("/api")) {

    return res.status(status).json({

      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,

    });

  }


  return res.status(status).sendFile(
    path.join(frontendPath, "errors", "500.html")
  );

});




// START SERVER

const server = app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});




// SHUTDOWN

const shutdown = () => {

  server.close(() => {

    process.exit(0);

  });

};


process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
