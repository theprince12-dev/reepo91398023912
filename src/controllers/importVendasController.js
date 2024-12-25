// src/controllers/importVendasController.js
const validacaoFreteIndividualService = require('../services/validacaoFreteIndividualService');

class ImportVendasController {
    async validarFrete(req, res, next) {
        try {
            const { venda_id } = req.params;
            const result = await validacaoFreteIndividualService.validarFrete(venda_id);
             res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ImportVendasController();