const prisma = require('../lib/prisma');

const canManageLeague = (user, ligaId) =>
  user.role === 'SUPER_ADMIN' ||
  (user.role === 'LEAGUE_ADMIN' && Number(user.ligaId) === Number(ligaId));

const listSeasons = async (req, res) => {
  try {
    const ligaId = Number(req.query.ligaId);
    if (!ligaId) {
      return res.status(400).json({ message: 'ligaId es requerido' });
    }

    const seasons = await prisma.season.findMany({
      where: { ligaId },
      orderBy: [{ activa: 'desc' }, { anio: 'desc' }, { nombre: 'asc' }],
    });

    return res.json(seasons);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar temporadas', error: error.message });
  }
};

const createSeason = async (req, res) => {
  try {
    const { ligaId, nombre, anio, fechaInicio, fechaFin, activa } = req.body;
    if (!ligaId || !nombre || !anio) {
      return res.status(400).json({ message: 'ligaId, nombre y anio son requeridos' });
    }

    if (!canManageLeague(req.user, ligaId)) {
      return res.status(403).json({ message: 'No puedes crear temporadas para esta liga' });
    }

    const liga = await prisma.league.findUnique({ where: { id: Number(ligaId) } });
    if (!liga) return res.status(404).json({ message: 'Liga no encontrada' });

    const season = await prisma.season.create({
      data: {
        ligaId: Number(ligaId),
        nombre: nombre.trim(),
        anio: Number(anio),
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activa: activa === undefined ? true : Boolean(activa),
      },
    });

    return res.status(201).json(season);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe esa temporada en la liga' });
    }
    return res.status(500).json({ message: 'Error al crear temporada', error: error.message });
  }
};

const updateSeason = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const season = await prisma.season.findUnique({ where: { id } });
    if (!season) return res.status(404).json({ message: 'Temporada no encontrada' });

    if (!canManageLeague(req.user, season.ligaId)) {
      return res.status(403).json({ message: 'No puedes actualizar esta temporada' });
    }

    const { nombre, anio, fechaInicio, fechaFin, activa } = req.body;
    const updated = await prisma.season.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(anio !== undefined ? { anio: Number(anio) } : {}),
        ...(fechaInicio !== undefined
          ? { fechaInicio: fechaInicio ? new Date(fechaInicio) : null }
          : {}),
        ...(fechaFin !== undefined ? { fechaFin: fechaFin ? new Date(fechaFin) : null } : {}),
        ...(activa !== undefined ? { activa: Boolean(activa) } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar temporada', error: error.message });
  }
};

const deleteSeason = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const season = await prisma.season.findUnique({ where: { id } });
    if (!season) return res.status(404).json({ message: 'Temporada no encontrada' });

    if (!canManageLeague(req.user, season.ligaId)) {
      return res.status(403).json({ message: 'No puedes eliminar esta temporada' });
    }

    await prisma.season.delete({ where: { id } });
    return res.json({ message: 'Temporada eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar temporada', error: error.message });
  }
};

module.exports = {
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
};
