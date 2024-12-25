// src/controllers/dimensaoPacoteController.js
const dimensaoPacoteService = require('../services/dimensaoPacoteService');

class DimensaoPacoteController {
    async obterDimensaoPacote(req, res, next) {
        try {
            const { shipmentId } = req.params;
            const dimensaoPacote = await dimensaoPacoteService.obterDimensaoPacote(shipmentId);
             res.json({ success: true, message: `Dimensões do pacote ${shipmentId} obtidas com sucesso.`, dimensaoPacote: dimensaoPacote });
       } catch (error) {
             next(error);
        }
     }
 }

module.exports = new DimensaoPacoteController();