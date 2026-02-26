const router = require('express').Router();
const {
  listMatches,
  createMatch,
  updateMatch,
  registerResult,
  deleteMatch,
} = require('../controllers/partidos.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listMatches);
router.post(
  '/',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  createMatch,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  updateMatch,
);
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  deleteMatch,
);
router.post(
  '/:id/resultado',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin', 'silla'),
  registerResult,
);

module.exports = router;
