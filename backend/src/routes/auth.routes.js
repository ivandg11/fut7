const router = require('express').Router();
const { verificarClave } = require('../controllers/auth.controller');

router.post('/verificar-clave', verificarClave);

module.exports = router;
