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
  requireRoles('SUPER_ADMIN', 'admin'),
  createPlayer,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  updatePlayer,
);
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  deletePlayer,
);

module.exports = router;
