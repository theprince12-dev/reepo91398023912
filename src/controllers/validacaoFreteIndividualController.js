// src/controllers/validacaoFreteIndividualController.js
 const validacaoFreteIndividualService = require('../services/validacaoFreteIndividualService');
 const authService = require('../services/authService')
 const fetch = require('node-fetch').default;

 class ValidacaoFreteIndividualController {
     async validarFrete(req, res, next) {
          console.log('validarFrete: Iniciando validação para a venda ', req.params.venda_id);
         try {
             const { venda_id } = req.params;
             console.log('validarFrete: Headers da requisição', req.headers);
            const authHeader = req.headers.authorization;
            let accessToken;

            if(authHeader && authHeader.startsWith('Bearer ')) {
                accessToken = authHeader.substring(7);
            } else {
                  console.log('validarFrete: Token inválido ou não informado');
                
                 const token = await authService.getValidToken();

                 const url = `http://localhost:3000/api/validate-frete/${venda_id}`;
                 const headers = {
                    'Authorization': `Bearer ${token}`,
                     'Content-Type': 'application/json',
                 };
               console.log('validarFrete: Redirecionando para a mesma rota com o token', {
                   method: 'GET',
                   headers: headers
               });
                 const response = await fetch(url, {
                     method: 'GET',
                     headers: headers,
                 });
     
                 if (!response.ok) {
                     const response_json = await response.json()
                     return res.status(response.status).json(response_json);
                 }
                 const result = await response.json()
                  return res.json(result);
            }
     
             console.log('validarFrete: Token obtido', accessToken);
             const result = await validacaoFreteIndividualService.validarFrete(venda_id, accessToken);
            res.json(result);
        } catch (error) {
            console.error('Erro no controller de validação:', error);
            next(error);
        }
   }
 }

 module.exports = new ValidacaoFreteIndividualController();