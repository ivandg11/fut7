const router = require('express').Router();
const {
  listLeagues,
  getLeagueById,
  createLeague,
  updateLeague,
  deleteLeague,
} = require('../controllers/ligas.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.get('/', listLeagues);
router.get('/:id', getLeagueById);
router.post('/', authRequired, requireRoles('SUPER_ADMIN'), createLeague);
router.put('/:id', authRequired, requireRoles('SUPER_ADMIN'), updateLeague);
router.delete('/:id', authRequired, requireRoles('SUPER_ADMIN'), deleteLeague);

module.exports = router;
