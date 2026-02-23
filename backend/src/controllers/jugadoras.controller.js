const prisma = require('../lib/prisma');

const canManageLeague = (user, ligaId) =>
  user.role === 'SUPER_ADMIN' ||
  (user.role === 'LEAGUE_ADMIN' && Number(user.ligaId) === Number(ligaId));

const listPlayers = async (req, res) => {
  try {
    const { equipoId, temporadaId } = req.query;
    const where = { activa: true };

    if (equipoId) where.equipoId = Number(equipoId);
    if (temporadaId) where.equipo = { temporadaId: Number(temporadaId) };

    const players = await prisma.player.findMany({
      where,
      include: { equipo: true },
      orderBy: [{ equipo: { nombre: 'asc' } }, { nombre: 'asc' }],
    });

    return res.json(players);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar jugadoras', error: error.message });
  }
};

const createPlayer = async (req, res) => {
  try {
    const { equipoId, nombre, dorsal } = req.body;
    if (!equipoId || !nombre) {
      return res.status(400).json({ message: 'equipoId y nombre son requeridos' });
    }

    const team = await prisma.team.findUnique({
      where: { id: Number(equipoId) },
      include: { temporada: true },
    });
    if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });

    if (!canManageLeague(req.user, team.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes crear jugadoras en este equipo' });
    }

    const player = await prisma.player.create({
      data: {
        equipoId: Number(equipoId),
        nombre: nombre.trim(),
        dorsal: dorsal !== undefined && dorsal !== null ? Number(dorsal) : null,
      },
    });

    return res.status(201).json(player);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear jugadora', error: error.message });
  }
};

const updatePlayer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.player.findUnique({
      where: { id },
      include: { equipo: { include: { temporada: true } } },
    });
    if (!existing) return res.status(404).json({ message: 'Jugadora no encontrada' });

    if (!canManageLeague(req.user, existing.equipo.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes actualizar esta jugadora' });
    }

    const { nombre, dorsal, activa } = req.body;
    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(dorsal !== undefined ? { dorsal: dorsal === null ? null : Number(dorsal) } : {}),
        ...(activa !== undefined ? { activa: Boolean(activa) } : {}),
      },
    });

    return res.json(player);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar jugadora', error: error.message });
  }
};

const deletePlayer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.player.findUnique({
      where: { id },
      include: { equipo: { include: { temporada: true } } },
    });
    if (!existing) return res.status(404).json({ message: 'Jugadora no encontrada' });

    if (!canManageLeague(req.user, existing.equipo.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes eliminar esta jugadora' });
    }

    await prisma.player.update({ where: { id }, data: { activa: false } });
    return res.json({ message: 'Jugadora dada de baja' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar jugadora', error: error.message });
  }
};

module.exports = {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
