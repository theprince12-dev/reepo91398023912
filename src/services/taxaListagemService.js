// src/services/taxaListagemService.js
const config = require('../config/mercadoLivre');
const fetch = require('node-fetch').default;

class TaxaListagemService {
    async getListingPrices(price, category_id, listing_type_id) {
      console.log(`getListingPrices: URL da requisição https://api.mercadolibre.com/sites/MLB/listing_prices?price=${price}&category_id=${category_id}&listing_type_id=${listing_type_id}`);
        try {
            const url = `${config.api_base_url}/sites/MLB/listing_prices?price=${price}&category_id=${category_id}&listing_type_id=${listing_type_id}`;
               console.log(`getListingPrices: URL da requisição ${url}`);
            const response = await fetch(url);
               console.log(`getListingPrices: Resposta da Requisição ${response.status}`, response);
                if (!response.ok) {
                  throw new Error(`Erro ao buscar taxas de listagem: ${response.statusText}`);
                }

            const data = await response.json();
                console.log('getListingPrices: Resposta da Requisição', data);

             if(!data?.sale_fee_details){
               console.log('getListingPrices: Taxas não encontradas');
                return null;
               }
            console.log('getListingPrices: Retornando dados');
            return data;
        } catch (error) {
            console.error('getListingPrices: Erro ao obter taxas de listagem:', error);
            throw error;
        }
         finally {
             console.log('getListingPrices: Método finalizado');
        }
    }
}
module.exports = new TaxaListagemService();