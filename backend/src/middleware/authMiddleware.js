const path = require('path');

const errorsPath = path.join(__dirname, '../../../frontend/errors');

const sendErrorPage = (res, status, file) =>
  res.status(status).sendFile(path.join(errorsPath, file));

const sendErrorJson = (res, status, message) =>
  res.status(status).json({ message });

const isApiRequest = (req) => req.originalUrl.startsWith('/api');

const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return isApiRequest(req)
      ? sendErrorJson(res, 401, 'Unauthorized — please log in')
      : sendErrorPage(res, 401, '401.html');
  }
  if (req.session.user.role !== 'admin') {
    return isApiRequest(req)
      ? sendErrorJson(res, 403, 'Forbidden — admins only')
      : sendErrorPage(res, 403, '403.html');
  }
  next();
};

const requireReader = (req, res, next) => {
  if (!req.session.user) {
    return isApiRequest(req)
      ? sendErrorJson(res, 401, 'Unauthorized — please log in')
      : sendErrorPage(res, 401, '401.html');
  }
  if (req.session.user.role !== 'reader') {
    return isApiRequest(req)
      ? sendErrorJson(res, 403, 'Forbidden — readers only')
      : sendErrorPage(res, 403, '403.html');
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return isApiRequest(req)
      ? sendErrorJson(res, 401, 'Unauthorized — please log in')
      : sendErrorPage(res, 401, '401.html');
  }
  next();
};

module.exports = { requireAdmin, requireReader, requireAuth };