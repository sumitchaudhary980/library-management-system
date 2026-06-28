const express = require("express");
const path = require("path");
const session = require("express-session");

require("./config/initDb");

const pageRoute  = require("./routes/pageRoute");
const authRoute  = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute  = require("./routes/userRoute");

const app = express();

// ── Single source of truth ──
const frontendPath = path.join(__dirname, '../../frontend');

app.use(express.json());

app.use(
  session({
    secret: "Herald@12345",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use('/assets', express.static(path.join(frontendPath, 'assets')));
app.use('/errors', express.static(path.join(frontendPath, 'errors')));

app.use("/", pageRoute);
app.use("/api/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/user", userRoute);

// ── 404 ──
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api'))
    return res.status(404).json({ message: 'Resource not found' });
  res.status(404).sendFile(path.join(frontendPath, 'errors/404.html'));
});

// ── 500 ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.originalUrl.startsWith('/api'))
    return res.status(500).json({ message: 'Internal server error' });
  res.status(500).sendFile(path.join(frontendPath, 'errors/500.html'));
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});