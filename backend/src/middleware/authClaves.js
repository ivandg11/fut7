const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verificarClaveAdmin = async (req, res, next) => {
  try {
    const clave = req.headers['x-clave-admin'];

    if (!clave) {
      return res
        .status(401)
        .json({ message: 'Se requiere clave de administrador' });
    }

    const config = await prisma.configuracion.findFirst();

    if (!config || clave !== config.clave_admin) {
      return res
        .status(403)
        .json({ message: 'Clave de administrador inválida' });
    }

    req.rol = 'admin';
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar clave' });
  }
};

const verificarClaveEditor = async (req, res, next) => {
  try {
    const claveEditor = req.headers['x-clave-editor'];
    const claveAdmin = req.headers['x-clave-admin'];
    const clave = claveEditor || claveAdmin;

    if (!clave) {
      return res
        .status(401)
        .json({ message: 'Se requiere clave de editor o administrador' });
    }

    const config = await prisma.configuracion.findFirst();

    if (!config) {
      return res.status(500).json({ message: 'Error de configuración' });
    }

    if (clave === config.clave_admin) {
      req.rol = 'admin';
      return next();
    }

    if (clave === config.clave_editor) {
      req.rol = 'editor';
      return next();
    }

    return res.status(403).json({ message: 'Clave inválida' });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar clave' });
  }
};

const publicRoute = (req, res, next) => {
  req.rol = 'publico';
  next();
};

module.exports = { verificarClaveAdmin, verificarClaveEditor, publicRoute };
