const { PrismaClient } = require('@prisma/client');
const { actualizarEstadisticas } = require('./equipos.controller');
const prisma = new PrismaClient();

const crearPartido = async (req, res) => {
  try {
    const { ligaId, equipoLocalId, equipoVisitaId, fecha, cancha, horario, jornada } = req.body;

    if (equipoLocalId === equipoVisitaId) {
      return res.status(400).json({ message: 'Un equipo no puede jugar contra sí mismo' });
    }

    // Verificar que los equipos pertenecen a la misma liga
    const equipoLocal = await prisma.equipo.findUnique({ 
      where: { id: equipoLocalId },
      include: { liga: true }
    });
    
    const equipoVisita = await prisma.equipo.findUnique({ 
      where: { id: equipoVisitaId },
      include: { liga: true }
    });

    if (!equipoLocal || !equipoVisita) {
      return res.status(404).json({ message: 'Uno o ambos equipos no existen' });
    }

    if (equipoLocal.ligaId !== parseInt(ligaId) || equipoVisita.ligaId !== parseInt(ligaId)) {
      return res.status(400).json({ message: 'Los equipos deben pertenecer a la misma liga' });
    }

    const partido = await prisma.partido.create({
      data: {
        ligaId: parseInt(ligaId),
        equipoLocalId,
        equipoVisitaId,
        fecha: new Date(fecha),
        cancha,
        horario,
        jornada,
        golesLocal: 0,
        golesVisita: 0,
        jugado: false
      },
      include: {
        equipoLocal: true,
        equipoVisita: true,
        liga: true
      }
    });

    res.status(201).json(partido);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Ya existe un partido entre estos equipos en esta jornada' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error al crear partido' });
  }
};

const registrarResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisita } = req.body;

    const partido = await prisma.partido.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipoLocal: true,
        equipoVisita: true,
        liga: true
      }
    });

    if (!partido) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    if (partido.jugado) {
      return res.status(400).json({ message: 'Este partido ya fue jugado' });
    }

    // Calcular puntos
    let puntosLocal = 0, puntosVisita = 0;
    if (golesLocal > golesVisita) {
      puntosLocal = 3;
    } else if (golesLocal < golesVisita) {
      puntosVisita = 3;
    } else {
      puntosLocal = 1;
      puntosVisita = 1;
    }

    // Actualizar partido
    const partidoActualizado = await prisma.partido.update({
      where: { id: parseInt(id) },
      data: { golesLocal, golesVisita, jugado: true }
    });

    // Actualizar estadísticas de los equipos
    await actualizarEstadisticas(partido.equipoLocalId, golesLocal, golesVisita, puntosLocal);
    await actualizarEstadisticas(partido.equipoVisitaId, golesVisita, golesLocal, puntosVisita);

    res.json({ 
      message: 'Resultado registrado exitosamente',
      partido: partidoActualizado 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar resultado' });
  }
};

const obtenerPartidos = async (req, res) => {
  try {
    const { ligaId, jornada } = req.query;
    
    let where = {};
    if (ligaId) where.ligaId = parseInt(ligaId);
    if (jornada) where.jornada = parseInt(jornada);
    
    const partidos = await prisma.partido.findMany({
      where,
      include: {
        equipoLocal: true,
        equipoVisita: true,
        liga: true
      },
      orderBy: [
        { jornada: 'asc' },
        { horario: 'asc' }
      ]
    });
    
    res.json(partidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener partidos' });
  }
};

const obtenerPartidosPorLiga = async (req, res) => {
  try {
    const { dia } = req.params;
    const { jornada } = req.query;
    
    const liga = await prisma.liga.findUnique({
      where: { dia }
    });
    
    if (!liga) {
      return res.status(404).json({ message: 'Liga no encontrada' });
    }
    
    let where = { ligaId: liga.id };
    if (jornada) where.jornada = parseInt(jornada);
    
    const partidos = await prisma.partido.findMany({
      where,
      include: {
        equipoLocal: true,
        equipoVisita: true
      },
      orderBy: [
        { jornada: 'asc' },
        { horario: 'asc' }
      ]
    });
    
    res.json({
      liga,
      partidos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener partidos' });
  }
};

const obtenerJornadas = async (req, res) => {
  try {
    const { ligaId } = req.query;
    
    const jornadas = await prisma.partido.findMany({
      where: { ligaId: parseInt(ligaId) },
      select: { jornada: true },
      distinct: ['jornada'],
      orderBy: { jornada: 'asc' }
    });
    
    res.json(jornadas.map(j => j.jornada));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener jornadas' });
  }
};

module.exports = {
  crearPartido,
  registrarResultado,
  obtenerPartidos,
  obtenerPartidosPorLiga,
  obtenerJornadas
};