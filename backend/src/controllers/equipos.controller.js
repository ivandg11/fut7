const prisma = require('../lib/prisma');

const canManageLeague = (user, ligaId) =>
  user.role === 'SUPER_ADMIN' ||
  (user.role === 'LEAGUE_ADMIN' && Number(user.ligaId) === Number(ligaId));

const listTeams = async (req, res) => {
  try {
    const temporadaId = Number(req.query.temporadaId);
    if (!temporadaId) {
      return res.status(400).json({ message: 'temporadaId es requerido' });
    }

    const teams = await prisma.team.findMany({
      where: { temporadaId },
      include: {
        _count: {
          select: { jugadoras: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return res.json(teams);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar equipos', error: error.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id },
      include: { temporada: true, jugadoras: { where: { activa: true }, orderBy: { nombre: 'asc' } } },
    });
    if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });
    return res.json(team);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener equipo', error: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const { temporadaId, nombre, escudoUrl } = req.body;
    if (!temporadaId || !nombre) {
      return res.status(400).json({ message: 'temporadaId y nombre son requeridos' });
    }

    const season = await prisma.season.findUnique({ where: { id: Number(temporadaId) } });
    if (!season) return res.status(404).json({ message: 'Temporada no encontrada' });

    if (!canManageLeague(req.user, season.ligaId)) {
      return res.status(403).json({ message: 'No puedes crear equipos en esta liga' });
    }

    const team = await prisma.team.create({
      data: {
        temporadaId: Number(temporadaId),
        nombre: nombre.trim(),
        escudoUrl: escudoUrl?.trim() || null,
      },
    });

    return res.status(201).json(team);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe ese equipo en la temporada' });
    }
    return res.status(500).json({ message: 'Error al crear equipo', error: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id },
      include: { temporada: true },
    });
    if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });

    if (!canManageLeague(req.user, team.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes actualizar este equipo' });
    }

    const { nombre, escudoUrl } = req.body;
    const updated = await prisma.team.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(escudoUrl !== undefined ? { escudoUrl: escudoUrl?.trim() || null } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar equipo', error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id },
      include: { temporada: true },
    });
    if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });

    if (!canManageLeague(req.user, team.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes eliminar este equipo' });
    }

    await prisma.team.delete({ where: { id } });
    return res.json({ message: 'Equipo eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar equipo', error: error.message });
  }
};

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
