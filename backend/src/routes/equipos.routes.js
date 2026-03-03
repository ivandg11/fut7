const router = require('express').Router();
const {
  listTeams,
  getTeamById,
  getTeamAttendanceReport,
  createTeam,
  updateTeam,
  deleteTeam,
  adjustTeamPoints,
} = require('../controllers/equipos.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listTeams);
router.get('/:id', getTeamById);
router.get(
  '/:id/asistencias',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  getTeamAttendanceReport,
);
router.post(
  '/',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  createTeam,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  updateTeam,
);
router.post(
  '/:id/ajuste-puntos',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  adjustTeamPoints,
);
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  deleteTeam,
);

module.exports = router;
