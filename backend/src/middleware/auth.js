const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    req.userRole = verified.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar roles específicos
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }
    next();
  };
};

// Middleware para verificar que un SCORER solo registre en sus canchas asignadas
const checkCanchaAsignada = async (req, res, next) => {
  try {
    if (req.userRole === 'SCORER') {
      const { canchaId } = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { canchaIds: true },
      });

      if (!user.canchaIds.includes(canchaId)) {
        return res.status(403).json({
          message: 'No estás asignado a esta cancha',
        });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verificando permisos' });
  }
};

module.exports = { authMiddleware, checkRole, checkCanchaAsignada };
