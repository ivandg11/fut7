const router = require('express').Router();
const {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} = require('../controllers/equipos.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listTeams);
router.get('/:id', getTeamById);
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
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  deleteTeam,
);

module.exports = router;
