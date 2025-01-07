 // src/services/validacaoFreteService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const itemService = require('./itemService');
const ValidacaoFrete = require('../models/validacaoFreteModel');
const sequelize = require('../config/database')

class ValidacaoFreteService {
  async validarFrete(venda, accessToken) {
    try {
        await sequelize.sync();
        const {id, order_items, shipping } = venda;
          const frete_pago = venda?.payments?.[0]?.shipping_cost ?? null;
        let item_id = null;
        let item = null;
        if(order_items && order_items.length > 0 && order_items[0]?.item?.id){
            item_id =  order_items[0]?.item?.id
           try{
              item = await itemService.getItemById(item_id, accessToken);
           } catch (error) {
            console.error(`Erro ao obter o item ${item_id}:`, error.message)
            }
         }
           // Lógica de cálculo do frete esperado
          let frete_esperado = null;
          if(item) {
            frete_esperado = await this.calcularFreteEsperado(item, venda?.seller?.address);
           }
       await ValidacaoFrete.upsert({
           venda_id: id,
             item_id: item_id,
           frete_esperado: frete_esperado,
             frete_pago: frete_pago,
      });
      console.log(`Frete validado com sucesso para a venda ${id}, com o item ${item_id}`);
      return {frete_esperado, frete_pago};
 } catch (error) {
     console.error('Erro ao obter e salvar vendas:', error.message);
        if (error.message === 'Token inválido ou expirado') {
             throw { name: 'TokenError', message: error.message };
          }
       throw error;
  }
}
 
async calcularFreteEsperado(item, seller_address) {
     try{
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
        console.log("Dados do seller address", seller_address)
        console.log("Frete esperado calculado:", frete_esperado)
         return frete_esperado;
      } catch (error) {
        console.error('Erro ao calcular o frete esperado', error);
          throw error;
      }
 }
}
module.exports = new ValidacaoFreteService();