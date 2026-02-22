const router = require('express').Router();
const {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/jugadoras.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listPlayers);
router.post(
  '/',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  createPlayer,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  updatePlayer,
);
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  deletePlayer,
);

module.exports = router;
