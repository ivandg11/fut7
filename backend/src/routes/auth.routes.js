const router = require('express').Router();
const {
  login,
  getMe,
  createLeagueAdmin,
  createUserBySuperAdmin,
  listUsersBySuperAdmin,
  deleteUserBySuperAdmin,
  visitorToken,
} = require('../controllers/auth.controller');
const { authRequired, requireRoles } = require('../middleware/auth');

router.post('/login', login);
router.post('/visitor-token', visitorToken);
router.get('/me', authRequired, getMe);
router.post(
  '/league-admin',
  authRequired,
  requireRoles('SUPER_ADMIN'),
  createLeagueAdmin,
);
router.get('/users', authRequired, requireRoles('SUPER_ADMIN'), listUsersBySuperAdmin);
router.post('/users', authRequired, requireRoles('SUPER_ADMIN'), createUserBySuperAdmin);
router.delete('/users/:id', authRequired, requireRoles('SUPER_ADMIN'), deleteUserBySuperAdmin);

module.exports = router;
