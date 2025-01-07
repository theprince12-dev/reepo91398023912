// src/services/vendaService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const Venda = require('../models/vendaModel');
const sequelize = require('../config/database')
const detalhesVendaService = require('./detalhesVendaService');
const validacaoFreteService = require('./validacaoFreteService');


class VendaService {
  async getAllSales(fromDate, toDate) {
    try {
         await sequelize.sync();
         const accessToken = await authService.getValidToken();
           const sellerId = await authService.obterSellerId(accessToken);
           if(!sellerId) {
                throw new Error("Não foi possível obter o seller id.");
              }

            const url = `${config.api_base_url}/orders/search?seller=${sellerId}&order.date_created.from=${fromDate}&order.date_created.to=${toDate}&limit=50&offset=0`;
            console.log('getAllSales: URL da requisição', url);
          const response = await fetch(url, {
             headers: { 'Authorization': `Bearer ${accessToken}` },
           });
          if (!response.ok) {
               if (response.status === 401) {
                  throw new Error('Token inválido ou expirado');
                }
                 throw new Error(`Erro ao buscar vendas: ${response.statusText}`);
           }
         const data = await response.json();
           console.log('getAllSales: Resposta da Requisição', data);
           const sales = data.results;

           // Salvar as vendas no banco de dados
         for (const sale of sales) {
               const { id, date_created, buyer, status, total_amount, order_items, shipping } = sale;
               let item_id = null;
                   if(order_items && order_items.length > 0 && order_items[0]?.item?.id)
                     item_id = order_items[0]?.item?.id
                await Venda.upsert({
                   order_id: id,
                    date_created: date_created,
                   buyer_id: buyer.id,
                     buyer_nickname: buyer.nickname,
                     status: status,
                   total_amount: total_amount
              });
               console.log(`Venda ${id} salva ou atualizada com sucesso no banco de dados`);
                // Obter e salvar os detalhes da venda
               const detalhesVenda = await detalhesVendaService.obterDetalhesVenda(id, accessToken); // <--- Passa o token corretamente
                 await detalhesVendaService.salvarDetalhesVenda(detalhesVenda);
                // Validar frete
             try {
                    await validacaoFreteService.validarFrete(sale, accessToken)
             } catch (error) {
                   console.error(`Erro ao validar frete da venda ${id}:`, error);
             }
         }
         return sales;
} catch (error) {
    console.error('Erro ao obter e salvar vendas:', error);
      if (error.message === 'Token inválido ou expirado') {
          throw { name: 'TokenError', message: error.message };
     }
   throw error;
}
}
}
module.exports = new VendaService();