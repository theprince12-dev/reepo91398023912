    // src/services/taxaListagemService.js
    const fetch = require('node-fetch').default;
    const config = require('../config/mercadoLivre');
    const authService = require('./authService');
    const sequelize = require('../config/database');

    class TaxaListagemService {
          async getListingPrices(price, category_id, listing_type_id) {
            try {
                 await sequelize.sync();
                const url = `${config.api_base_url}/sites/MLB/listing_prices?price=${price}&category_id=${category_id}&listing_type_id=${listing_type_id}`;
                    console.log('getListingPrices: URL da requisição', url);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erro ao obter as taxas de listagem: ${response.statusText}`);
                 }
                const data = await response.json();
                  console.log('getListingPrices: Resposta da Requisição', data);
                 const resultado_listagem = data.find(item => item.listing_type_id === listing_type_id);
                   if(!resultado_listagem) throw new Error(`Não foi possível obter taxas para o tipo de listagem ${listing_type_id}`);
                 return resultado_listagem;
            } catch (error) {
               console.error('Erro ao obter as taxas de listagem', error);
                 throw error;
           }
      }
   }
    module.exports = new TaxaListagemService();