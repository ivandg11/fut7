const prisma = require('../lib/prisma');

const canManageLeague = (user, ligaId) =>
  user.role === 'SUPER_ADMIN' ||
  (user.role === 'LEAGUE_ADMIN' && Number(user.ligaId) === Number(ligaId));

const listMatches = async (req, res) => {
  try {
    const temporadaId = Number(req.query.temporadaId);
    const jornada = req.query.jornada ? Number(req.query.jornada) : null;
    if (!temporadaId) {
      return res.status(400).json({ message: 'temporadaId es requerido' });
    }

    const matches = await prisma.match.findMany({
      where: {
        temporadaId,
        ...(jornada ? { jornada } : {}),
      },
      include: {
        equipoLocal: true,
        equipoVisita: true,
        goles: {
          include: { jugadora: true },
        },
      },
      orderBy: [{ jornada: 'asc' }, { fecha: 'asc' }],
    });

    return res.json(matches);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar partidos', error: error.message });
  }
};

const createMatch = async (req, res) => {
  try {
    const { temporadaId, equipoLocalId, equipoVisitaId, jornada, fecha, cancha } = req.body;
    if (!temporadaId || !equipoLocalId || !equipoVisitaId || !jornada || !fecha) {
      return res.status(400).json({
        message: 'temporadaId, equipoLocalId, equipoVisitaId, jornada y fecha son requeridos',
      });
    }
    if (Number(equipoLocalId) === Number(equipoVisitaId)) {
      return res.status(400).json({ message: 'Un equipo no puede jugar contra si mismo' });
    }

    const season = await prisma.season.findUnique({ where: { id: Number(temporadaId) } });
    if (!season) return res.status(404).json({ message: 'Temporada no encontrada' });
    if (!canManageLeague(req.user, season.ligaId)) {
      return res.status(403).json({ message: 'No puedes crear partidos en esta liga' });
    }

    const [local, visita] = await prisma.$transaction([
      prisma.team.findUnique({ where: { id: Number(equipoLocalId) } }),
      prisma.team.findUnique({ where: { id: Number(equipoVisitaId) } }),
    ]);

    if (!local || !visita) return res.status(404).json({ message: 'Equipo local o visitante no existe' });
    if (local.temporadaId !== Number(temporadaId) || visita.temporadaId !== Number(temporadaId)) {
      return res.status(400).json({ message: 'Los equipos deben pertenecer a la misma temporada' });
    }

    const match = await prisma.match.create({
      data: {
        temporadaId: Number(temporadaId),
        equipoLocalId: Number(equipoLocalId),
        equipoVisitaId: Number(equipoVisitaId),
        jornada: Number(jornada),
        fecha: new Date(fecha),
        cancha: cancha?.trim() || null,
      },
      include: { equipoLocal: true, equipoVisita: true },
    });

    return res.status(201).json(match);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear partido', error: error.message });
  }
};

const updateMatch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.match.findUnique({
      where: { id },
      include: { temporada: true },
    });
    if (!existing) return res.status(404).json({ message: 'Partido no encontrado' });
    if (!canManageLeague(req.user, existing.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes actualizar este partido' });
    }

    const { jornada, fecha, cancha } = req.body;
    const updated = await prisma.match.update({
      where: { id },
      data: {
        ...(jornada !== undefined ? { jornada: Number(jornada) } : {}),
        ...(fecha !== undefined ? { fecha: new Date(fecha) } : {}),
        ...(cancha !== undefined ? { cancha: cancha?.trim() || null } : {}),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar partido', error: error.message });
  }
};

const registerResult = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { goles } = req.body;
    if (!Array.isArray(goles)) {
      return res.status(400).json({ message: 'goles debe ser un arreglo [{ jugadoraId, minuto? }]' });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        temporada: true,
        equipoLocal: true,
        equipoVisita: true,
      },
    });
    if (!match) return res.status(404).json({ message: 'Partido no encontrado' });
    if (!canManageLeague(req.user, match.temporada.ligaId)) {
      return res.status(403).json({ message: 'No puedes registrar este resultado' });
    }

    const playerIds = goalsToPlayerIds(goles);
    const players = playerIds.length
      ? await prisma.player.findMany({
          where: { id: { in: playerIds } },
          include: { equipo: true },
        })
      : [];
    const playersMap = new Map(players.map((p) => [p.id, p]));

    let golesLocal = 0;
    let golesVisita = 0;
    const goalsData = [];

    for (const goal of goles) {
      const jugadoraId = Number(goal.jugadoraId);
      const player = playersMap.get(jugadoraId);
      if (!player) {
        return res.status(400).json({ message: `Jugadora ${jugadoraId} no encontrada` });
      }

      const teamId = player.equipoId;
      if (teamId === match.equipoLocalId) golesLocal += 1;
      else if (teamId === match.equipoVisitaId) golesVisita += 1;
      else {
        return res.status(400).json({
          message: `La jugadora ${player.nombre} no pertenece a equipos del partido`,
        });
      }

      goalsData.push({
        partidoId: match.id,
        jugadoraId,
        equipoId: teamId,
        minuto: goal.minuto !== undefined && goal.minuto !== null ? Number(goal.minuto) : null,
      });
    }

    const updatedMatch = await prisma.$transaction(async (tx) => {
      await tx.matchGoal.deleteMany({ where: { partidoId: match.id } });
      if (goalsData.length) {
        await tx.matchGoal.createMany({ data: goalsData });
      }
      return tx.match.update({
        where: { id: match.id },
        data: {
          golesLocal,
          golesVisita,
          status: 'JUGADO',
        },
        include: {
          equipoLocal: true,
          equipoVisita: true,
          goles: {
            include: { jugadora: true },
          },
        },
      });
    });

    return res.json(updatedMatch);
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar resultado', error: error.message });
  }
};

const goalsToPlayerIds = (goles) => {
  const ids = [];
  for (const goal of goles) {
    const id = Number(goal.jugadoraId);
    if (Number.isInteger(id) && id > 0) ids.push(id);
  }
  return [...new Set(ids)];
};

module.exports = {
  listMatches,
  createMatch,
  updateMatch,
  registerResult,
};
