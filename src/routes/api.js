// src/routes/api.js
const express = require('express');
const authService = require('../services/authService');
const productController = require('../controllers/productController');
const vendaController = require('../controllers/vendaController');
const itemController = require('../controllers/itemController');
const validacaoFreteIndividualController = require('../controllers/validacaoFreteIndividualController');
const taxaListagemController = require('../controllers/taxaListagemController');
const dimensaoPacoteController = require('../controllers/dimensaoPacoteController');
const userController = require('../controllers/userController'); // Importe o userController

const router = express.Router();

router.get('/auth/url', (req, res) => {
    const url = authService.getAuthorizationUrl();
    res.json({ authorizationUrl: url });
});

router.get('/auth/redirect', (req, res) => {
   const url = authService.getAuthorizationUrl();
    res.redirect(url);
});

router.get('/auth/callback', async (req, res) => {
    try {
       const { code } = req.query;
       const token = await authService.getInitialTokens(code);
      res.json({ success: true, message: 'Autenticação realizada com sucesso', access_token: token });
    } catch (error) {
       res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/auth/test', async (req, res) => {
  try {
       const token = await authService.getValidToken();
       const user = await authService.validateCurrentToken(token)
     res.json({success: true, token: token, tokenIsValid: user})
   } catch (error) {
      res.status(500).json({success: false, error: error.message})
    }
});

router.get('/products/:productId', productController.getProduct);
router.get('/sales', vendaController.getAllSales);
router.get('/items/:itemId', itemController.getItem);
router.get('/validate-frete/:venda_id', validacaoFreteIndividualController.validarFrete);
router.get('/listing-prices', taxaListagemController.getListingPrices);
router.get('/shipments/:shipmentId', dimensaoPacoteController.obterDimensaoPacote);
router.get('/users/:user_id', userController.getUser); // Adicione a rota de usuário

module.exports = router;