const path = require("path");
const db = require("../config/db");

const errorsPath = path.join(__dirname, "../../../frontend/errors");

const sendErrorPage = (res, status, file) =>
  res.status(status).sendFile(path.join(errorsPath, file));

const sendErrorJson = (res, status, message) =>
  res.status(status).json({ message });

const isApiRequest = (req) => req.originalUrl.startsWith("/api");

const unauthorized = (req, res) =>
  isApiRequest(req)
    ? sendErrorJson(res, 401, "Unauthorized — please log in")
    : sendErrorPage(res, 401, "401.html");


// Validate session user from database
const validateSessionUser = async (req) => {
  if (!req.session.user) {
    return null;
  }

  try {
    const user = await db
      .prepare(
        `
        SELECT id, role
        FROM users
        WHERE id = ?
        `
      )
      .get(req.session.user.id);

    return user || null;

  } catch (err) {
    console.error("Session validation error:", err.message);
    return null;
  }
};


const authenticate = async (req, res) => {
  const user = await validateSessionUser(req);

  if (!user) {

    req.session.destroy(() => {});

    res.clearCookie("sid");

    unauthorized(req, res);

    return null;
  }


  // Keep session role synced
  req.session.user.role = user.role;

  return user;
};



const requireAuth = async (req, res, next) => {

  const user = await authenticate(req, res);

  if (!user) {
    return;
  }

  next();
};



const requireAdmin = async (req, res, next) => {

  const user = await authenticate(req, res);

  if (!user) {
    return;
  }


  if (user.role !== "admin") {

    return isApiRequest(req)
      ? sendErrorJson(res, 403, "Forbidden — admins only")
      : sendErrorPage(res, 403, "403.html");

  }


  next();
};



const requireReader = async (req, res, next) => {

  const user = await authenticate(req, res);

  if (!user) {
    return;
  }


  if (user.role !== "reader") {

    return isApiRequest(req)
      ? sendErrorJson(res, 403, "Forbidden — readers only")
      : sendErrorPage(res, 403, "403.html");

  }


  next();
};



module.exports = {
  requireAuth,
  requireAdmin,
  requireReader,
};