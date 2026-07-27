const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const startFineCron = require("./jobs/fineCron");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
  
});
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

require("./config/initDb");
startFineCron();
const pageRoute = require("./routes/pageRoute");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;

const frontendPath = path.join(__dirname, "../../frontend");
const sessionPath = path.join(__dirname, "database");

if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
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

        scriptSrcAttr: ["'unsafe-inline'"],

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Apply rate limiter only to API routes
app.use("/api", rateLimiter);


app.use(
  session({
    name: "sid",

    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: sessionPath,
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);


app.use(
  "/assets",
  express.static(path.join(frontendPath, "assets"), {
    etag: true,
    maxAge: "1d",
  })
);


app.use(
  "/errors",
  express.static(path.join(frontendPath, "errors"), {
    etag: true,
    maxAge: "1d",
  })
);


app.use("/", pageRoute);

app.use("/api/auth", authRoute);

app.use("/api/admin", adminRoute);

app.use("/api/user", userRoute);



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



app.use((err, req, res, next) => {

  console.error(err);

  const status = err.status || 500;


  if (req.originalUrl.startsWith("/api")) {

    return res.status(status).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });

  }


  res.status(status).sendFile(
    path.join(frontendPath, "errors", "500.html")
  );

});



const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const shutdown = () => {

  server.close(() => {
    process.exit(0);
  });

};


process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);