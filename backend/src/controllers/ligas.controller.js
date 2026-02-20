const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LIGAS_POR_DEFECTO = [
  { dia: 'LUNES', nombre: 'Liga Lunes' },
  { dia: 'MARTES', nombre: 'Liga Martes' },
  { dia: 'MIERCOLES', nombre: 'Liga Miercoles' },
  { dia: 'JUEVES', nombre: 'Liga Jueves' },
  { dia: 'VIERNES', nombre: 'Liga Viernes' },
  { dia: 'SABADO', nombre: 'Liga Sabado' },
];

const asegurarLigasPorDefecto = async () => {
  const ligasActuales = await prisma.liga.findMany({
    select: { dia: true },
  });

  const diasActuales = new Set(ligasActuales.map((liga) => liga.dia));
  const faltantes = LIGAS_POR_DEFECTO.filter(
    (liga) => !diasActuales.has(liga.dia),
  );

  if (faltantes.length > 0) {
    await prisma.liga.createMany({
      data: faltantes,
      skipDuplicates: true,
    });
  }
};

const obtenerLigas = async (req, res) => {
  try {
    await asegurarLigasPorDefecto();

    const ligas = await prisma.liga.findMany({
      orderBy: { id: 'asc' },
    });

    return res.json(ligas);
  } catch (error) {
    console.error('Error al obtener ligas:', error);
    return res
      .status(500)
      .json({ message: 'Error al obtener ligas', error: error.message });
  }
};

const obtenerLigaPorDia = async (req, res) => {
  try {
    const { dia } = req.params;

    await asegurarLigasPorDefecto();

    const liga = await prisma.liga.findUnique({
      where: { dia },
    });

    if (!liga) {
      return res.status(404).json({ message: 'Liga no encontrada' });
    }

    return res.json(liga);
  } catch (error) {
    console.error('Error al obtener liga:', error);
    return res
      .status(500)
      .json({ message: 'Error al obtener liga', error: error.message });
  }
};

const crearLiga = async (req, res) => {
  try {
    const { dia, nombre } = req.body;

    const liga = await prisma.liga.create({
      data: { dia, nombre },
    });

    return res.status(201).json(liga);
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ message: 'Ya existe una liga para este dia' });
    }
    console.error('Error al crear liga:', error);
    return res
      .status(500)
      .json({ message: 'Error al crear liga', error: error.message });
  }
};

const actualizarLiga = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activa } = req.body;

    const liga = await prisma.liga.update({
      where: { id: parseInt(id, 10) },
      data: { nombre, activa },
    });

    return res.json(liga);
  } catch (error) {
    console.error('Error al actualizar liga:', error);
    return res
      .status(500)
      .json({ message: 'Error al actualizar liga', error: error.message });
  }
};

module.exports = {
  obtenerLigas,
  obtenerLigaPorDia,
  crearLiga,
  actualizarLiga,
};
