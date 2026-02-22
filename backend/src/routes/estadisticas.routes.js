const router = require('express').Router();
const {
  getStandings,
  getScorers,
} = require('../controllers/estadisticas.controller');

router.get('/tabla', getStandings);
router.get('/goleo', getScorers);

module.exports = router;
