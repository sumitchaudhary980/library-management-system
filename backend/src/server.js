const express = require("express");
const path = require("path");
const session = require("express-session");

require("./config/initDb");

const pageRoute = require("./routes/pageRoute");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");

const app = express();

app.use(express.json());

app.use(
  session({
    secret: "Herald@12345",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,       // prevents JS from reading the cookie
      maxAge: 1000 * 60 * 60,
    },
  })
);

// Only expose assets, not raw HTML files
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

app.use("/", pageRoute);
app.use("/api/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/user", userRoute);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});