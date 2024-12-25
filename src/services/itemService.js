        // src/services/itemService.js
        const fetch = require('node-fetch').default;
        const config = require('../config/mercadoLivre');
        const authService = require('./authService');
        const Item = require('../models/itemModel');
        const sequelize = require('../config/database');
        const taxaListagemService = require('./taxaListagemService');
    
        class ItemService {
            async getItemById(itemId, accessToken = null) {
                try {
                     let headers = {}
                       if(accessToken){
                           headers = { 'Authorization': `Bearer ${accessToken}` };
                      }
                     const url = `${config.api_base_url}/items/${itemId}`;
                     const response = await fetch(url, {headers: headers});
                     if (!response.ok) {
                         throw new Error(`Erro ao obter item: ${response.statusText}`);
                      }
                      const data = await response.json();
                     console.log(`Dados obtidos do item ${itemId}`, data);
    
                      const { category_id, price, listing_type_id, shipping } = data;
                       // Buscar dados da taxa de listagem e salvar no banco de dados
                     let fixed_fee = null;
                       let gross_amount = null;
                       let percentage_fee = null;
                      let shipping_options = null;
                    let list_cost = null;
                     if (category_id && price && listing_type_id) {
                         try{
                              const taxas = await taxaListagemService.getListingPrices(price, category_id, listing_type_id);
                                fixed_fee = taxas?.sale_fee_details?.fixed_fee;
                                gross_amount = taxas?.sale_fee_details?.gross_amount;
                                 percentage_fee = taxas?.sale_fee_details?.percentage_fee;
                           } catch (error) {
                                console.error('Erro ao buscar as taxas do item:', error.message);
                          }
                    }
                      if(shipping && shipping.options && shipping.options.length > 0){
                        shipping_options = shippingInfo.options[0]?.cost;
                        list_cost = shippingInfo?.options[0]?.list_cost ?? shipping_options
                   }

                      
                     await Item.upsert({
                        id: data.id,
                         free_shipping: shipping?.free_shipping ?? null,
                          logistic_type: shipping?.logistic_type ?? null,
                         category_id: category_id,
                          original_price: data.original_price,
                         price: data.price,
                           base_price: data.base_price,
                          listing_type_id: listing_type_id,
                         condition: data.condition,
                            title: data.title,
                           catalog_listing: data.catalog_listing,
                             status: data.status,
                              fixed_fee: fixed_fee,
                             gross_amount: gross_amount,
                              percentage_fee: percentage_fee,
                              shipping_options: shipping_options,
                              list_cost: list_cost
                         });
                        console.log(`Item ${data.id} salvo ou atualizado com sucesso no banco de dados`);
                         return data;
                } catch (error) {
                     console.error('Erro ao obter detalhes do item:', error);
                       throw error;
               }
           }
            async getShippingOptions(itemId, zip_code, accessToken = null) {
                try {
                     let headers = {}
                     if(accessToken){
                         headers = { 'Authorization': `Bearer ${accessToken}` };
                    }
                     const url = `${config.api_base_url}/items/${itemId}/shipping_options?zip_code=${zip_code}`;
                      const response = await fetch(url, {
                          headers: headers
                      });
                      if (!response.ok) {
                          throw new Error(`Erro ao obter opções de envio do item: ${response.statusText}`);
                     }
                      return await response.json();
                 } catch (error) {
                       console.error('Erro ao obter opções de envio do item:', error);
                      throw error;
                  }
             }
       }
        
module.exports = new ItemService();