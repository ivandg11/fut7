const router = require('express').Router();
const { verificarClaveEditor, publicRoute } = require('../middleware/authClaves');
const {
  crearPartido,
  registrarResultado,
  obtenerPartidos,
  obtenerPartidosPorLiga,
  obtenerJornadas
} = require('../controllers/partidos.controller');

// Rutas públicas
router.get('/', publicRoute, obtenerPartidos);
router.get('/jornadas', publicRoute, obtenerJornadas);
router.get('/liga/:dia', publicRoute, obtenerPartidosPorLiga);

// Rutas para editores y admin
router.post('/', verificarClaveEditor, crearPartido);
router.put('/:id/resultado', verificarClaveEditor, registrarResultado);

module.exports = router;