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
                   shipping_options = shippingInfo.options[0]?.cost ?? null; // Mudança aqui: Adiciona o shipping_options
               }
               await this.saveItem({
                   ...data,
                    fixed_fee: fixed_fee,
                    gross_amount: gross_amount,
                     percentage_fee: percentage_fee,
                     free_shipping: shipping?.free_shipping ?? null,
                   logistic_type: shipping?.logistic_type ?? null,
                       shipping_options: shipping_options,
                     list_cost: shipping_options // Mudança aqui: Define list_cost como shipping_options
                });
              return data;
           } catch (error) {
                console.error('Erro ao obter detalhes do item:', error);
                  throw error;
            }
     }
    }
    
module.exports = new ItemService();