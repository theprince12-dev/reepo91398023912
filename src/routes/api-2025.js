const express = require('express');
const validacaoFreteController2025 = require('../controllers/validacaoFreteController2025');

const router = express.Router();

// Rotas para validação de fretes - versão 2025
router.post('/freight/validate/:shipping_id', validacaoFreteController2025.validarFretePacote);
router.get('/freight/validations', validacaoFreteController2025.buscarValidacoesFrete);
router.get('/freight/validations/stats', validacaoFreteController2025.estatisticasValidacoes);
router.get('/freight/validations/:shipping_id', validacaoFreteController2025.obterDetalhesValidacao);
router.post('/users/current', validacaoFreteController2025.obterUsuarioAtual);

module.exports = router;
