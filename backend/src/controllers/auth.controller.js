const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      ligaId: user.ligaId || null,
      nombre: user.nombre,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const ensureSuperAdmin = async () => {
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  if (existing) return;

  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@soccergdl.com';
  const nombre = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      nombre,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
};

const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userIdentifier = (username || email || '').trim();
    if (!userIdentifier || !password) {
      return res.status(400).json({ message: 'Usuario y password son requeridos' });
    }

    await ensureSuperAdmin();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { nombre: userIdentifier },
          { email: userIdentifier.toLowerCase() },
        ],
      },
    });

    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
        ligaId: user.ligaId,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar sesion', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, role: true, ligaId: true, activo: true },
    });
    if (!user || !user.activo) return res.status(401).json({ message: 'Sesion no valida' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

const createLeagueAdmin = async (req, res) => {
  try {
    const { email, nombre, password, ligaId } = req.body;
    if (!email || !nombre || !password || !ligaId) {
      return res.status(400).json({
        message: 'email, nombre, password y ligaId son requeridos',
      });
    }

    const liga = await prisma.league.findUnique({ where: { id: Number(ligaId) } });
    if (!liga) return res.status(404).json({ message: 'Liga no encontrada' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        nombre: nombre.trim(),
        passwordHash,
        role: 'LEAGUE_ADMIN',
        ligaId: Number(ligaId),
      },
      select: { id: true, email: true, nombre: true, role: true, ligaId: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El correo ya esta registrado' });
    }
    return res.status(500).json({ message: 'Error al crear admin de liga', error: error.message });
  }
};

const visitorToken = async (_req, res) => {
  const token = jwt.sign(
    {
      sub: null,
      role: 'VISITOR',
      nombre: 'Visitante',
      ligaId: null,
    },
    JWT_SECRET,
    { expiresIn: '24h' },
  );

  return res.json({
    token,
    user: { role: 'VISITOR', nombre: 'Visitante', ligaId: null },
  });
};

module.exports = {
  login,
  getMe,
  createLeagueAdmin,
  visitorToken,
};
