// src/routes/api-simplificado.js
/**
 * Rotas da API para a versão simplificada da validação de frete
 * Essas rotas usam a implementação direta que utiliza as dimensões 
 * fornecidas pela API do Mercado Livre em /shipments/{id}/items
 */
const express = require('express');
const router = express.Router();

const validacaoFreteController = require('../controllers/validacaoFreteControllerSimplificado');

// Rota para validar o frete de um pacote específico
router.post('/validacao-frete/pacote/:shipping_id', validacaoFreteController.validarPacote);

// Rota para listar itens e dimensões de um pacote (diagnóstico)
router.get('/validacao-frete/pacote/:shipping_id/itens', validacaoFreteController.listarItensPacote);

// Rota para validar múltiplos pacotes em lote
router.post('/validacao-frete/lote', validacaoFreteController.validarLote);

module.exports = router;
