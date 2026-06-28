const requireAuth = (req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ message: 'Unauthorized — please log in' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ message: 'Unauthorized — please log in' });
  if (req.session.user.role !== 'admin')
    return res.status(403).json({ message: 'Forbidden — admins only' });
  next();
};

const requireReader = (req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ message: 'Unauthorized — please log in' });
  if (req.session.user.role !== 'reader')
    return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { requireAuth, requireAdmin, requireReader };