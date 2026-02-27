const router = require('express').Router();
const {
  login,
  getMe,
  createLeagueAdmin,
  createUserBySuperAdmin,
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
router.post('/users', authRequired, requireRoles('SUPER_ADMIN'), createUserBySuperAdmin);

module.exports = router;
