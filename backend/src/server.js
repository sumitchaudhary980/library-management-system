const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cookieParser = require("cookie-parser");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

require("./config/initDb");

const pageRoute = require("./routes/pageRoute");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");

const app = express();

const frontendPath = path.join(__dirname, "../../frontend");

const sessionPath = path.join(__dirname, "database");


if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, {
    recursive: true,
  });
}


app.use(express.json());

app.use(cookieParser());


app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: sessionPath,
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);



app.use(
  "/assets",
  express.static(path.join(frontendPath, "assets"))
);


app.use(
  "/errors",
  express.static(path.join(frontendPath, "errors"))
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
    path.join(frontendPath, "errors/404.html")
  );

});



app.use((err, req, res, next) => {

  console.error(err.stack);


  if (req.originalUrl.startsWith("/api")) {

    return res.status(500).json({
      message: "Internal server error",
    });

  }


  res.status(500).sendFile(
    path.join(frontendPath, "errors/500.html")
  );

});

app.use((err, req, res, next) => {
  if (err.message) {
    return res.status(400).json({
      message: err.message,
    });
  }

  next(err);
});

app.listen(3000, () => {
  console.log("Server running on port 300");
});