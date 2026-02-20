const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const obtenerOCrearConfiguracion = async () => {
  let config = await prisma.configuracion.findFirst();
  if (!config) {
    config = await prisma.configuracion.create({
      data: {
        clave_admin: 'admin123',
        clave_editor: 'editor123',
      },
    });
  }
  return config;
};

const verificarClave = async (req, res) => {
  try {
    const { tipo, clave } = req.body;

    if (!tipo || !clave) {
      return res.status(400).json({ message: 'Tipo y clave son requeridos' });
    }

    const config = await obtenerOCrearConfiguracion();

    if (tipo === 'admin') {
      if (clave !== config.clave_admin) {
        return res
          .status(403)
          .json({ message: 'Clave de administrador invalida' });
      }
      return res.json({ message: 'Acceso concedido', rol: 'admin' });
    }

    if (tipo === 'editor') {
      if (clave === config.clave_admin) {
        return res.json({ message: 'Acceso concedido', rol: 'admin' });
      }
      if (clave === config.clave_editor) {
        return res.json({ message: 'Acceso concedido', rol: 'editor' });
      }
      return res.status(403).json({ message: 'Clave de editor invalida' });
    }

    return res.status(400).json({ message: 'Tipo de acceso invalido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { verificarClave };
