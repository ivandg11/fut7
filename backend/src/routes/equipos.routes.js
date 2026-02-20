const router = require('express').Router();
const {
  verificarClaveAdmin,
  publicRoute,
} = require('../middleware/authClaves');
const {
  crearEquipo,
  obtenerEquipos,
  obtenerEquiposPorLiga,
  actualizarEquipo,
  eliminarEquipo,
} = require('../controllers/equipos.controller');

// Rutas públicas (todos pueden ver)
router.get('/', publicRoute, obtenerEquipos);
router.get('/liga/:dia', publicRoute, obtenerEquiposPorLiga);

// Rutas protegidas (solo admin)
router.post('/', verificarClaveAdmin, crearEquipo);
router.put('/:id', verificarClaveAdmin, actualizarEquipo);
router.delete('/:id', verificarClaveAdmin, eliminarEquipo);

module.exports = router;
