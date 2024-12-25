// src/controllers/vendaController.js
const vendaService = require('../services/vendaService');
const validacaoFreteService = require('../services/validacaoFreteService');

 class VendaController {
   async getAllSales(req, res, next) {
         try {
             const { from, to } = req.query;
            const sales = await vendaService.getAllSales(from, to);
            res.json({success: true, message: 'Vendas obtidas e salvas com sucesso!', sales: sales});
         } catch (error) {
             next(error);
         }
   }
}

module.exports = new VendaController();