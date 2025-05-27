// src/routes/api.js
const express = require('express');
const authService = require('../services/authService');
const productController = require('../controllers/productController');
const vendaController = require('../controllers/vendaController');
const validacaoFreteIndividualController = require('../controllers/validacaoFreteIndividualController');
const taxaListagemController = require('../controllers/taxaListagemController');
const dimensaoPacoteController = require('../controllers/dimensaoPacoteController');
const userController = require('../controllers/userController'); // Importe o userController
const grantController = require('../controllers/grantController'); // Importe o grantController
const categoryController = require('../controllers/categoryController'); // Importe o categoryController
const freteReportController = require('../controllers/freteReportController'); // Importe o controller de relatórios de frete
const validacaoFreteController = require('../controllers/validacaoFreteController'); // Importe o controller de validação de fretes

const router = express.Router();

router.get('/auth/url', (req, res) => {
    const url = authService.getAuthorizationUrl();
    res.json({ authorizationUrl: url });
});

router.get('/auth/redirect', (req, res) => {
    const url = authService.getAuthorizationUrl();
    
    // Send a page with instructions and a direct link to authorize
    res.send(`
        <html>
            <head>
                <title>Mercado Livre Authorization</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1, h2 { color: #2d3277; }
                    .info-box { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #e8f5e9; border-left: 4px solid #4caf50; }
                    .warning-box { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #fff8e1; border-left: 4px solid #ffc107; }
                    .code-form { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #2d3277; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 16px; }
                    .button:hover { background-color: #1a237e; }
                    input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
                    .steps { margin-left: 20px; }
                    .steps li { margin-bottom: 10px; }
                    .code-extractor { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; display: none; }
                    .url-input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
                    .extracted-code { font-family: monospace; padding: 10px; background-color: #e8f5e9; border-radius: 4px; margin-top: 10px; display: none; }
                    .error-message { color: #d32f2f; margin-top: 10px; display: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Mercado Livre Authorization</h1>
                    
                    <div class="info-box">
                        <h2>Step 1: Authorize the Application</h2>
                        <p>Click the button below to authorize this application with your Mercado Livre account:</p>
                        <a href="${url}" class="button" target="_blank">Authorize with Mercado Livre</a>
                    </div>
                    
                    <div class="warning-box">
                        <h2>Step 2: Copy the URL after authorization</h2>
                        <p>After authorizing, you will be redirected to Google with a URL that contains a code parameter.</p>
                        <ol class="steps">
                            <li>After clicking the button above and authorizing, you'll be redirected to Google</li>
                            <li>Copy the <strong>entire URL</strong> from your browser's address bar</li>
                            <li>Paste it in the box below</li>
                        </ol>
                    </div>
                    
                    <div class="code-form">
                        <h2>Step 3: Extract and Submit the Authorization Code</h2>
                        <p>Paste the Google URL here to automatically extract the code:</p>
                        <input type="text" id="urlInput" class="url-input" placeholder="Paste the entire Google URL here" />
                        <button id="extractButton" class="button">Extract Code</button>
                        
                        <div id="extractedCode" class="extracted-code"></div>
                        <div id="errorMessage" class="error-message"></div>
                        
                        <form id="codeForm" action="/api/auth/callback" method="get" style="margin-top: 20px; display: none;">
                            <input type="hidden" id="codeInput" name="code" />
                            <button type="submit" class="button">Complete Authorization</button>
                        </form>
                    </div>
                </div>
                
                <script>
                    document.getElementById('extractButton').addEventListener('click', function() {
                        const urlInput = document.getElementById('urlInput').value.trim();
                        const extractedCodeElement = document.getElementById('extractedCode');
                        const errorMessageElement = document.getElementById('errorMessage');
                        const codeForm = document.getElementById('codeForm');
                        const codeInput = document.getElementById('codeInput');
                        
                        // Reset display
                        extractedCodeElement.style.display = 'none';
                        errorMessageElement.style.display = 'none';
                        codeForm.style.display = 'none';
                        
                        if (!urlInput) {
                            errorMessageElement.textContent = 'Please paste the Google URL first.';
                            errorMessageElement.style.display = 'block';
                            return;
                        }
                        
                        // Extract code from URL
                        const codeMatch = urlInput.match(/[?&]code=([^&]+)/);
                        if (codeMatch && codeMatch[1]) {
                            const code = codeMatch[1];
                            extractedCodeElement.textContent = 'Code extracted: ' + code;
                            extractedCodeElement.style.display = 'block';
                            
                            // Set the code in the hidden input and show the form
                            codeInput.value = code;
                            codeForm.style.display = 'block';
                        } else {
                            errorMessageElement.textContent = 'Could not find a code parameter in the URL. Please make sure you copied the entire URL after authorization.';
                            errorMessageElement.style.display = 'block';
                        }
                    });
                </script>
            </body>
        </html>
    `);
});

router.get('/auth/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send(`
                <html>
                    <head>
                        <title>Authorization Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            h1 { color: #d32f2f; }
                            .error-box { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #ffebee; border-left: 4px solid #d32f2f; }
                            .button { display: inline-block; padding: 10px 20px; background-color: #2d3277; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Authorization Error</h1>
                            <div class="error-box">
                                <p><strong>Missing authorization code.</strong></p>
                                <p>No authorization code was received from Mercado Livre. Please try again.</p>
                            </div>
                            <a href="/api/auth/redirect" class="button">Try Again</a>
                        </div>
                    </body>
                </html>
            `);
        }
        
        // Get the access token using the authorization code
        const token = await authService.getInitialTokens(code);
        
        // Return a success page with the token
        res.send(`
            <html>
                <head>
                    <title>Authorization Successful</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #2d3277; }
                        .success-box { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #e8f5e9; border-left: 4px solid #4caf50; }
                        .token-display { font-family: monospace; padding: 10px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; margin-top: 10px; }
                        .button { display: inline-block; padding: 10px 20px; background-color: #2d3277; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Authorization Successful</h1>
                        <div class="success-box">
                            <p><strong>Your application has been successfully authorized with Mercado Livre!</strong></p>
                            <p>The access token has been obtained and stored for future API requests.</p>
                            <div class="token-display">${token}</div>
                        </div>
                        <p>You can now close this window and return to the application.</p>
                        <a href="/api/sales?from=2025-01-01T00:00:00.000Z&to=2025-05-01T23:59:59.999Z" class="button">Test API Access</a>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error in callback:', error);
        res.status(500).send(`
            <html>
                <head>
                    <title>Authorization Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #d32f2f; }
                        .error-box { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #ffebee; border-left: 4px solid #d32f2f; }
                        .error-details { font-family: monospace; padding: 10px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; margin-top: 10px; }
                        .button { display: inline-block; padding: 10px 20px; background-color: #2d3277; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Authorization Error</h1>
                        <div class="error-box">
                            <p><strong>An error occurred during the authorization process.</strong></p>
                            <p>Error details:</p>
                            <div class="error-details">${error.message}</div>
                        </div>
                        <a href="/api/auth/redirect" class="button">Try Again</a>
                    </div>
                </body>
            </html>
        `);
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
router.get('/products/:productId/description', productController.getProductDescription);
router.get('/products/:productId/variations', productController.getProductVariations);
router.get('/products/:productId/images', productController.getProductImages);

// Sales routes
router.get('/sales', vendaController.getAllSales); // Apenas busca vendas
router.post('/sales/process-details/:sale_id', vendaController.processSaleDetails); // Processa detalhes de UMA venda
router.post('/sales/validate-shipping/:shipping_id', vendaController.validateSaleShipping); // Valida frete de UM envio
router.post('/sales/batch-process-details', vendaController.batchProcessSalesDetails); // Processa detalhes de VÁRIAS vendas
router.post('/sales/batch-validate-shipping', vendaController.batchValidateSalesShipping); // Valida frete de VÁRIOS envios

// Legacy route for individual freight validation (can be deprecated or kept for specific use cases)
router.get('/validate-frete/:venda_id', validacaoFreteIndividualController.validarFrete); 

router.get('/listing-prices', taxaListagemController.getListingPrices);
router.get('/shipments/:shipmentId', dimensaoPacoteController.obterDimensaoPacote);
router.get('/users/me', userController.getCurrentUser); // Rota para obter usuário atual
router.get('/users/tokens', userController.getAllUserTokens); // Rota para obter todos os tokens de usuários
router.get('/users/active', userController.getActiveUsers); // Rota para obter todos os usuários ativos
router.get('/users/inactive', userController.getInactiveUsers); // Rota para obter usuários com tokens expirados
router.get('/users/selected', userController.getSelectedUser); // Rota para obter o usuário selecionado
router.post('/users/set-current', userController.setCurrentUser); // Rota para definir o usuário atual com token
router.post('/users/:user_id/select', userController.selectUser); // Rota para selecionar um usuário específico
router.post('/users/:user_id/refresh', userController.refreshUserToken); // Rota para renovar token de um usuário
router.get('/users/:user_id', userController.getUser); // Rota para obter usuário pelo ID
router.get('/grants', grantController.getAllGrants);

// Rotas para categorias
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/categories/:id/attributes', categoryController.getCategoryAttributes);
router.get('/categories/:id/children', categoryController.getChildCategories);
router.get('/categories/:id/compatibilities', categoryController.getAutoPartsCompatibilities);
router.post('/categories/:id/validate', categoryController.validateProductCategory);
router.get('/category-tree', categoryController.getCategoryTree);
router.get('/category-trends', categoryController.getCategoryTrends);
router.get('/autoparts-domains', categoryController.getAutoPartsDomains);

// Rotas para relatórios de frete
router.get('/reports/freight/discrepancies', freteReportController.getFreightDiscrepancies);
router.get('/reports/freight/summary', freteReportController.getSummaryReport);
router.get('/reports/freight/export', freteReportController.exportReport);
router.get('/reports/freight/shipment/:shipping_id', freteReportController.getShipmentDiscrepancy);

// Importando o controlador de processamento manual e o validador simplificado
const processamentoManualController = require('../controllers/processamentoManualController');
const validacaoFreteControllerSimplificado = require('../controllers/validacaoFreteControllerSimplificado');

// Rotas para validação de fretes - versão original
router.get('/freight-validations', validacaoFreteController.getValidations);
router.get('/freight-validations/:shipping_id', validacaoFreteController.getValidationDetails);
router.post('/freight-validations/:shipping_id/manual-validate', validacaoFreteController.manuallyValidate);
router.post('/freight-validations/:shipping_id/reprocess', validacaoFreteController.reprocessValidation);

// Rotas para validação de fretes - versão simplificada
router.post('/validate-shipping-simplified/:shipping_id', validacaoFreteControllerSimplificado.validarPacote);
router.post('/validate-shipping-simplified/batch', async (req, res) => {
    try {
        const { shipping_ids } = req.body;
        
        if (!shipping_ids || !Array.isArray(shipping_ids) || shipping_ids.length === 0) {
            return res.status(400).json({ 
                error: 'Lista de IDs de pacotes é obrigatória'
            });
        }
        
        await validacaoFreteControllerSimplificado.validarLote(req, res);
    } catch (error) {
        console.error('Erro ao validar lote de pacotes:', error);
        return res.status(500).json({ 
            error: 'Erro ao validar lote de pacotes', 
            details: error.message 
        });
    }
});
router.get('/validate-shipping-simplified/items/:shipping_id', validacaoFreteControllerSimplificado.listarItensPacote);

// Rotas para processamento manual
// Verificação e obtenção de dados
router.get('/processing/manual/check/:orderId', processamentoManualController.verificarVenda);
router.get('/processing/manual/:orderId/data', processamentoManualController.obterDadosVenda);
router.get('/processing/manual/:orderId/items', processamentoManualController.obterItensVenda);

// Processamento passo a passo
router.post('/processing/manual/:orderId/shipping', processamentoManualController.processarDadosEnvio);
router.post('/processing/manual/:orderId/validate', processamentoManualController.validarFrete);
router.post('/processing/manual/:orderId/finalize', processamentoManualController.finalizarProcessamento);

// Operações completas e de limpeza
router.post('/processing/manual/:orderId/execute-all', processamentoManualController.executarTodosPassos);
router.delete('/processing/manual/:orderId/clear', processamentoManualController.limparDadosProcessamento);

module.exports = router;
