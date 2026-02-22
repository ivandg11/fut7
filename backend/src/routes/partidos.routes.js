const router = require('express').Router();
const {
  listMatches,
  createMatch,
  updateMatch,
  registerResult,
} = require('../controllers/partidos.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listMatches);
router.post(
  '/',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  createMatch,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  updateMatch,
);
router.post(
  '/:id/resultado',
  authRequired,
  requireRoles('SUPER_ADMIN', 'LEAGUE_ADMIN'),
  registerResult,
);

module.exports = router;
