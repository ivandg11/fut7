const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obtenerConfiguracion = async (req, res) => {
  try {
    let config = await prisma.configuracion.findFirst();

    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          clave_admin: 'admin123',
          clave_editor: 'editor123',
        },
      });
    }

    res.json({ configurada: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener configuración' });
  }
};

const actualizarClaves = async (req, res) => {
  try {
    const {
      clave_admin_actual,
      clave_editor_actual,
      nueva_clave_admin,
      nueva_clave_editor,
    } = req.body;

    const config = await prisma.configuracion.findFirst();

    if (!config) {
      return res.status(404).json({ message: 'Configuración no encontrada' });
    }

    if (clave_admin_actual !== config.clave_admin) {
      return res
        .status(403)
        .json({ message: 'Clave de administrador actual incorrecta' });
    }

    const configActualizada = await prisma.configuracion.update({
      where: { id: config.id },
      data: {
        clave_admin: nueva_clave_admin || config.clave_admin,
        clave_editor: nueva_clave_editor || config.clave_editor,
      },
    });

    res.json({ message: 'Claves actualizadas exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar claves' });
  }
};

module.exports = { obtenerConfiguracion, actualizarClaves };
