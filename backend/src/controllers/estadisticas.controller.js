const prisma = require('../lib/prisma');

const getStandings = async (req, res) => {
  try {
    const temporadaId = Number(req.query.temporadaId);
    if (!temporadaId) {
      return res.status(400).json({ message: 'temporadaId es requerido' });
    }

    const [teams, matches] = await prisma.$transaction([
      prisma.team.findMany({
        where: { temporadaId },
        orderBy: { nombre: 'asc' },
      }),
      prisma.match.findMany({
        where: { temporadaId, status: 'JUGADO' },
      }),
    ]);

    const table = new Map();
    for (const team of teams) {
      table.set(team.id, {
        equipoId: team.id,
        equipo: team.nombre,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
      });
    }

    for (const match of matches) {
      const local = table.get(match.equipoLocalId);
      const visita = table.get(match.equipoVisitaId);
      if (!local || !visita) continue;

      local.pj += 1;
      visita.pj += 1;
      local.gf += match.golesLocal;
      local.gc += match.golesVisita;
      visita.gf += match.golesVisita;
      visita.gc += match.golesLocal;

      if (match.golesLocal > match.golesVisita) {
        local.pg += 1;
        local.pts += 3;
        visita.pp += 1;
      } else if (match.golesLocal < match.golesVisita) {
        visita.pg += 1;
        visita.pts += 3;
        local.pp += 1;
      } else {
        local.pe += 1;
        visita.pe += 1;
        local.pts += 1;
        visita.pts += 1;
      }
    }

    const standings = Array.from(table.values())
      .map((item) => ({ ...item, dg: item.gf - item.gc }))
      .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo))
      .map((item, index) => ({ ...item, posicion: index + 1 }));

    return res.json(standings);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener tabla de posiciones', error: error.message });
  }
};

const getScorers = async (req, res) => {
  try {
    const temporadaId = Number(req.query.temporadaId);
    if (!temporadaId) {
      return res.status(400).json({ message: 'temporadaId es requerido' });
    }

    const goals = await prisma.matchGoal.groupBy({
      by: ['jugadoraId'],
      where: {
        jugadora: {
          activa: true,
        },
        partido: {
          temporadaId,
          status: 'JUGADO',
        },
      },
      _count: { jugadoraId: true },
      orderBy: { _count: { jugadoraId: 'desc' } },
    });

    const playerIds = goals.map((goal) => goal.jugadoraId);
    const players = playerIds.length
      ? await prisma.player.findMany({
          where: { id: { in: playerIds }, activa: true },
          include: { equipo: true },
        })
      : [];

    const playersMap = new Map(players.map((player) => [player.id, player]));
    const scorers = goals
      .map((goal) => {
        const player = playersMap.get(goal.jugadoraId);
        if (!player) return null;
        return {
          jugadoraId: player.id,
          jugadora: player.nombre,
          equipoId: player.equipo.id,
          equipo: player.equipo.nombre,
          goles: goal._count.jugadoraId,
        };
      })
      .filter(Boolean)
      .map((item, index) => ({ ...item, posicion: index + 1 }));

    return res.json(scorers);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener tabla de goleo', error: error.message });
  }
};

module.exports = {
  getStandings,
  getScorers,
};
