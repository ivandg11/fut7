const router = require('express').Router();
const {
  verificarClaveAdmin,
  publicRoute,
} = require('../middleware/authClaves');
const {
  obtenerLigas,
  obtenerLigaPorDia,
  crearLiga,
  actualizarLiga,
} = require('../controllers/ligas.controller');

// Rutas públicas
router.get('/', publicRoute, obtenerLigas);
router.get('/:dia', publicRoute, obtenerLigaPorDia);

// Rutas protegidas (solo admin)
router.post('/', verificarClaveAdmin, crearLiga);
router.put('/:id', verificarClaveAdmin, actualizarLiga);

module.exports = router;
