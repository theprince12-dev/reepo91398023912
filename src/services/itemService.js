// src/services/itemService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const { Item } = require('../../models');
const taxaListagemService = require('./taxaListagemService');

class ItemService {
    async getItemById(itemId, accessToken = null) {
         try {
              console.log(`getItemById: Iniciando busca do item ${itemId}`);
              let headers = {}
                if(accessToken){
                    console.log(`getItemById: Token de acesso presente, adicionando ao header`);
                    headers = { 'Authorization': `Bearer ${accessToken}` };
                }
               const url = `${config.api_base_url}/items/${itemId}`;
               console.log(`getItemById: URL da requisição: ${url}`);
               const response = await fetch(url, {headers: headers});
                console.log(`getItemById: Resposta da API recebida com status ${response.status}`);
                if (!response.ok) {
                     console.warn(`getItemById: requisição retornou erro ${response.status} para o item ${itemId}`)
                     return null
                }
               const data = await response.json();
                 console.log(`getItemById: Dados obtidos do item ${itemId}`, data);

                const { category_id, price, listing_type_id, shipping } = data;
                 console.log(`getItemById: Dados extraídos do item: categoria=${category_id}, preço=${price}, tipo de listagem=${listing_type_id}`);
                 // Buscar dados da taxa de listagem e salvar no banco de dados
                let fixed_fee = null;
                 let gross_amount = null;
                let percentage_fee = null;
                 let shipping_options = null;
                 if (category_id && price && listing_type_id) {
                     console.log(`getItemById: Iniciando busca das taxas de listagem`);
                     try{
                        const taxas = await taxaListagemService.getListingPrices(price, category_id, listing_type_id);
                        console.log(`getItemById: Taxas de listagem obtidas:`, taxas);
                          fixed_fee = taxas?.sale_fee_details?.fixed_fee;
                          gross_amount = taxas?.sale_fee_details?.gross_amount;
                           percentage_fee = taxas?.sale_fee_details?.percentage_fee;
                        } catch (error) {
                             console.error('Erro ao buscar as taxas do item:', error.message);
                       }
                 }
                 if(shipping && shipping.options && shipping.options.length > 0){
                    console.log(`getItemById: Opções de frete encontradas`);
                   shipping_options = shipping.options[0]?.cost ?? null; // Mudança aqui: Adiciona o shipping_options
                   console.log(`getItemById: Opção de frete definida: ${shipping_options}`);
               }
                console.log('getItemById: Dados para salvar o item');
               await Item.upsert({
                   ...data,
                    fixed_fee: fixed_fee,
                    gross_amount: gross_amount,
                     percentage_fee: percentage_fee,
                     free_shipping: shipping?.free_shipping ?? null,
                   logistic_type: shipping?.logistic_type ?? null,
                       shipping_options: shipping_options,
                     list_cost: shipping_options // Mudança aqui: Define list_cost como shipping_options
                });
                console.log(`getItemById: Item salvo com sucesso`);
              return data;
           } catch (error) {
                console.error('Erro ao obter detalhes do item:', error);
                 return null
            }
     }
}
    
module.exports = new ItemService();