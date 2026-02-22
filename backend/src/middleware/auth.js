const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const authRequired = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido' });
  }
};

const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (token) {
      req.user = jwt.verify(token, JWT_SECRET);
    }
  } catch (_error) {
    req.user = null;
  }
  next();
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticacion requerida' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Permisos insuficientes' });
  }

  return next();
};

module.exports = {
  authRequired,
  optionalAuth,
  requireRoles,
};
