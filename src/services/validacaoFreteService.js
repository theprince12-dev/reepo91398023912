// src/services/validacaoFreteService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const itemService = require('./itemService');
const ValidacaoFrete = require('../models/validacaoFreteModel');
const sequelize = require('../config/database');

  async function obterCategoria(item){
       let categoria = 'outras'
        if(item.category_id)
           categoria = item.category_id
       return categoria
 }
async function obterTipoListagem(item){
    let tipo = 'normal'
      if(item.listing_type_id)
            tipo = item.listing_type_id
      return tipo;
  }
async function obterPeso(item){
        let peso = 0
       if(item.weight && item.weight.value)
            peso = item.weight.value
        return peso;
 }
class ValidacaoFreteService {
  async validarFrete(venda, accessToken) {
    try {
         await sequelize.sync();
            const {id, order_items, payments } = venda;
           const frete_pago = payments && payments[0] ? payments[0].shipping_cost : 0;
           const item_id = order_items && order_items[0] && order_items[0].item ? order_items[0].item.id : null;
            if(!item_id) throw new Error(`O item_id não foi encontrado na venda ${id}`);
           const item = await itemService.getItemById(item_id, accessToken);
            // Lógica de cálculo do frete esperado (precisa ser implementada)
            const frete_esperado = await this.calcularFreteEsperado(item);

           await ValidacaoFrete.upsert({
                venda_id: id,
                 item_id: item_id,
                frete_esperado: frete_esperado,
                frete_pago: frete_pago,
           });
             console.log(`Frete validado com sucesso para a venda ${id}, com o item ${item_id}`);
           return {frete_esperado, frete_pago};
     } catch (error) {
        console.error('Erro ao obter e salvar vendas:', error);
         if (error.message === 'Token inválido ou expirado') {
            throw { name: 'TokenError', message: error.message };
          }
           throw error;
     }
}
       // Função para calcular o frete esperado (a ser implementada)
     async calcularFreteEsperado(item) {
      // Lógica de cálculo do frete esperado
        let frete_esperado = 0;
         const categoria = await obterCategoria(item);
          const tipoListagem = await obterTipoListagem(item);
           const peso = await obterPeso(item);
          
         // Implementar a lógica de cálculo do frete (ex: com base na categoria, peso, etc.)
           if (peso > 0) {
               // Regra simples: frete = peso * valor
               frete_esperado =  peso * 1.5;
          } else {
               frete_esperado =  10
            }

          if (categoria === 'MLB1234') {
             // Regra para categoria específica
                frete_esperado += 5;
            }
  
         if (tipoListagem === "gold_premium"){
             //Regra para o tipo de listagem premium
                 frete_esperado += 20;
           }
        
            // Regra simples: frete = peso * valor * dimensões
           if (item.weight && item.weight.value && item.width && item.width.value && item.height && item.height.value && item.depth && item.depth.value)
                frete_esperado = (item.weight.value * 1.5) + (item.width.value * item.height.value * item.depth.value * 0.001)

         return frete_esperado;
       }
 }

 module.exports = new ValidacaoFreteService();