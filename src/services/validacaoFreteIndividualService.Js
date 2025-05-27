// src/services/validacaoFreteIndividualService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const itemService = require('./itemService');
const { ValidacaoFreteIndividual } = require('../../models');

class ValidacaoFreteIndividualService {
  async validarFrete(venda_id, accessToken) {
    try {
        // await sequelize.sync();
        const url = `${config.api_base_url}/orders/${venda_id}`;
         console.log(`validarFrete: URL da requisição - ${url}`);
       const response = await fetch(url, {
             headers: { 'Authorization': `Bearer ${accessToken}` },
         });
           console.log(`validarFrete: headers da requisição`, {
             'Authorization': `Bearer ${accessToken}`
          });
           console.log(`validarFrete: status code - `, response.status);
         if (!response.ok) {
               if (response.status === 401) {
                   throw new Error('Token inválido ou expirado');
                }
               throw new Error(`Erro ao buscar detalhes da venda: ${response.statusText}`);
           }
           const venda = await response.json();
            console.log('validarFrete: Resposta da Requisição', venda);
            const {id, order_items, payments } = venda;
           const item_id = order_items && order_items[0] && order_items[0].item ? order_items[0].item.id : null;
           if(!item_id) throw new Error(`O item_id não foi encontrado na venda ${id}`);
         const frete_pago = payments && payments[0] ? payments[0].shipping_cost : 0;
          const item = await itemService.getItemById(item_id, accessToken);
         const frete_esperado = await this.calcularFreteEsperado(item);
 
         await ValidacaoFreteIndividual.upsert({
               venda_id: id,
                item_id: item_id,
                 frete_esperado: frete_esperado,
                frete_pago: frete_pago,
                  status: 'concluído'
             });
            console.log(`Frete validado com sucesso para a venda ${id}, com o item ${item_id}`);
            return { success: true, message: `Frete validado com sucesso para a venda ${id}, com o item ${item_id}`};
      } catch (error) {
         console.error(`Erro ao validar frete da venda ${venda_id}`, error);
            await ValidacaoFreteIndividual.upsert({
                 venda_id: venda_id,
                  status: 'erro',
            });
             throw error;
         }
    }

  // Função para calcular o frete esperado (a ser implementada)
     async calcularFreteEsperado(item) {
       // Lógica de cálculo do frete esperado
        let frete_esperado = 0;
         const { category_id,  weight, depth, width, height, listing_type_id } = item;

        // Implementar a lógica de cálculo do frete (ex: com base na categoria, peso, etc.)
         if (weight && weight.value > 0) {
            // Regra simples: frete = peso * valor
             frete_esperado =  weight.value * 1.5;
        } else {
            frete_esperado =  10
        }
        
       if (category_id === 'MLB1234') {
           // Regra para categoria específica
            frete_esperado += 5;
         }
 
        if (listing_type_id === "gold_premium"){
             //Regra para o tipo de listagem premium
               frete_esperado += 20;
        }
 
        // Regra simples: frete = peso * valor * dimensões
       if (weight && weight.value > 0 && width && width.value && height && height.value && depth && depth.value)
            frete_esperado = (weight.value * 1.5) + (width.value * height.value * depth.value * 0.001)
        return frete_esperado;
    }
}

module.exports = new ValidacaoFreteIndividualService();