const router = require('express').Router();
const {
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
} = require('../controllers/temporadas.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listSeasons);
router.post(
  '/',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  createSeason,
);
router.put(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  updateSeason,
);
router.delete(
  '/:id',
  authRequired,
  requireRoles('SUPER_ADMIN', 'admin'),
  deleteSeason,
);

module.exports = router;
