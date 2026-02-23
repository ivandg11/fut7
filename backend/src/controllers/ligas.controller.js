const prisma = require('../lib/prisma');

const listLeagues = async (_req, res) => {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
    });
    return res.json(leagues);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar ligas', error: error.message });
  }
};

const getLeagueById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        temporadas: {
          where: { activa: true },
          orderBy: [{ anio: 'desc' }, { nombre: 'asc' }],
        },
      },
    });

    if (!league) return res.status(404).json({ message: 'Liga no encontrada' });
    return res.json(league);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener liga', error: error.message });
  }
};

const createLeague = async (req, res) => {
  try {
    const { nombre, tipo, ciudad } = req.body;
    if (!nombre || !tipo) {
      return res.status(400).json({ message: 'nombre y tipo son requeridos' });
    }

    const league = await prisma.league.create({
      data: {
        nombre: nombre.trim(),
        tipo,
        ciudad: ciudad?.trim() || null,
      },
    });
    return res.status(201).json(league);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe una liga con ese nombre y tipo' });
    }
    return res.status(500).json({ message: 'Error al crear liga', error: error.message });
  }
};

const updateLeague = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, tipo, ciudad, activa } = req.body;
    const league = await prisma.league.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(tipo !== undefined ? { tipo } : {}),
        ...(ciudad !== undefined ? { ciudad: ciudad?.trim() || null } : {}),
        ...(activa !== undefined ? { activa: Boolean(activa) } : {}),
      },
    });

    return res.json(league);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar liga', error: error.message });
  }
};

const deleteLeague = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return res.status(404).json({ message: 'Liga no encontrada' });

    await prisma.league.delete({ where: { id } });
    return res.json({ message: 'Liga eliminada' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'No puedes eliminar la liga porque tiene datos relacionados',
      });
    }
    return res.status(500).json({ message: 'Error al eliminar liga', error: error.message });
  }
};

module.exports = {
  listLeagues,
  getLeagueById,
  createLeague,
  updateLeague,
  deleteLeague,
};
