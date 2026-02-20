const router = require('express').Router();
const { verificarClaveAdmin } = require('../middleware/authClaves');
const {
  obtenerConfiguracion,
  actualizarClaves,
} = require('../controllers/config.controller');

router.get('/', verificarClaveAdmin, obtenerConfiguracion);
router.put('/claves', verificarClaveAdmin, actualizarClaves);

module.exports = router;
