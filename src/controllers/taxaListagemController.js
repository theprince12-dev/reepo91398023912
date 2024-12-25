// src/controllers/taxaListagemController.js
const taxaListagemService = require('../services/taxaListagemService');

class TaxaListagemController {
     async getListingPrices(req, res, next) {
        try {
            const { price, category_id, listing_type_id } = req.query;
             if(!price || !category_id || !listing_type_id){
                 return res.status(400).json({ success: false, error: "Você precisa informar os parâmetros 'price', 'category_id', e 'listing_type_id'" });
            }
         const result = await taxaListagemService.getListingPrices(price, category_id, listing_type_id);
             res.json(result);
      } catch (error) {
         next(error)
     }
  }
}

module.exports = new TaxaListagemController();