const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crearEquipo = async (req, res) => {
  try {
    const { nombre, ligaId } = req.body;

    console.log(`ðŸ“¥ Creando equipo: ${nombre} para liga ID: ${ligaId}`);

    // Validaciones
    if (!nombre || !ligaId) {
      return res
        .status(400)
        .json({ message: 'Nombre y ligaId son requeridos' });
    }

    // Verificar que la liga existe
    const liga = await prisma.liga.findUnique({
      where: { id: parseInt(ligaId) },
    });

    if (!liga) {
      console.log(`âŒ Liga no encontrada ID: ${ligaId}`);
      return res.status(404).json({ message: 'Liga no encontrada' });
    }

    const equipo = await prisma.equipo.create({
      data: {
        nombre,
        ligaId: parseInt(ligaId),
        partidosJugados: 0,
        golesFavor: 0,
        golesContra: 0,
        puntos: 0,
      },
      include: { liga: true },
    });

    console.log(`âœ… Equipo creado: ${equipo.nombre}`);
    res.status(201).json(equipo);
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ message: 'Ya existe un equipo con ese nombre en esta liga' });
    }
    console.error('âŒ Error al crear equipo:', error);
    res
      .status(500)
      .json({ message: 'Error al crear equipo', error: error.message });
  }
};

const obtenerEquipos = async (req, res) => {
  try {
    const { ligaId } = req.query;

    console.log(`ðŸ“¥ Obteniendo equipos para liga ID: ${ligaId || 'todas'}`);

    let where = {};
    if (ligaId) {
      where.ligaId = parseInt(ligaId);
    }

    const equipos = await prisma.equipo.findMany({
      where,
      include: { liga: true },
      orderBy: [{ puntos: 'desc' }, { golesFavor: 'desc' }],
    });

    console.log(`âœ… ${equipos.length} equipos encontrados`);
    res.json(equipos);
  } catch (error) {
    console.error('âŒ Error al obtener equipos:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener equipos', error: error.message });
  }
};

const obtenerEquiposPorLiga = async (req, res) => {
  try {
    const { dia } = req.params;

    console.log(`ðŸ“¥ Obteniendo equipos para liga dÃ­a: ${dia}`);

    // Primero obtener la liga por el dÃ­a
    const liga = await prisma.liga.findUnique({
      where: { dia },
    });

    if (!liga) {
      console.log(`âŒ Liga no encontrada para el dÃ­a: ${dia}`);
      return res.status(404).json({ message: 'Liga no encontrada' });
    }

    console.log(`âœ… Liga encontrada: ${liga.nombre} (ID: ${liga.id})`);

    const equipos = await prisma.equipo.findMany({
      where: { ligaId: liga.id },
      orderBy: [{ puntos: 'desc' }, { golesFavor: 'desc' }],
    });

    console.log(`âœ… ${equipos.length} equipos encontrados para ${dia}`);
    res.json(equipos);
  } catch (error) {
    console.error('âŒ Error al obtener equipos por liga:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener equipos', error: error.message });
  }
};

const actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    console.log(`ðŸ“¥ Actualizando equipo ID: ${id}`);

    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: { nombre },
      include: { liga: true },
    });

    console.log(`âœ… Equipo actualizado: ${equipo.nombre}`);
    res.json(equipo);
  } catch (error) {
    console.error('âŒ Error al actualizar equipo:', error);
    res
      .status(500)
      .json({ message: 'Error al actualizar equipo', error: error.message });
  }
};

const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const equipoId = parseInt(id);

    console.log(`📥 Eliminando equipo ID: ${equipoId}`);

    await prisma.$transaction(async (tx) => {
      await tx.partido.deleteMany({
        where: {
          OR: [{ equipoLocalId: equipoId }, { equipoVisitaId: equipoId }],
        },
      });

      await tx.equipo.delete({
        where: { id: equipoId },
      });
    });

    console.log(`✅ Equipo eliminado ID: ${equipoId}`);
    res.json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar equipo:', error);
    res
      .status(500)
      .json({ message: 'Error al eliminar equipo', error: error.message });
  }
};
const actualizarEstadisticas = async (
  equipoId,
  golesFavor,
  golesContra,
  puntosGanados,
) => {
  try {
    console.log(`ðŸ“¥ Actualizando estadÃ­sticas equipo ID: ${equipoId}`);

    const equipo = await prisma.equipo.update({
      where: { id: equipoId },
      data: {
        partidosJugados: { increment: 1 },
        golesFavor: { increment: golesFavor },
        golesContra: { increment: golesContra },
        puntos: { increment: puntosGanados },
      },
    });

    console.log(`âœ… EstadÃ­sticas actualizadas para: ${equipo.nombre}`);
    return equipo;
  } catch (error) {
    console.error('âŒ Error al actualizar estadÃ­sticas:', error);
    throw error;
  }
};

module.exports = {
  crearEquipo,
  obtenerEquipos,
  obtenerEquiposPorLiga,
  actualizarEquipo,
  eliminarEquipo,
  actualizarEstadisticas,
};

