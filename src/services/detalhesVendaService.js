// src/services/detalhesVendaService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const DimensaoPacoteService = require('./dimensaoPacoteService');
const DetalhesVenda = require('../models/detalhesVendaModel');
 const sequelize = require('../config/database');

class DetalhesVendaService {
  async obterDetalhesVenda(venda_id, accessToken) {
    try {
        await sequelize.sync();
        const url = `${config.api_base_url}/orders/search?seller=me&ids=${venda_id}`;
         const response = await fetch(url, {
             headers: { 'Authorization': `Bearer ${accessToken}` }
           });
           if (!response.ok) {
               if (response.status === 401) {
                   throw new Error('Token inválido ou expirado');
                }
               throw new Error(`Erro ao obter detalhes da venda: ${response.statusText}`);
           }
           const data = await response.json();
           const venda = data.results?.[0] ?? null;
           let dimensions = null
          let senders_cost = null;
        if(venda && venda?.shipping?.id){
               try{
                 const shipmentCosts = await this.obterCustosEnvio(venda.shipping.id, accessToken);
                   senders_cost = shipmentCosts?.senders?.[0]?.cost ?? null
                     dimensions = await new DimensaoPacoteService().obterDimensaoPacote(venda.shipping.id, accessToken);
                } catch(error){
                     console.error('Erro ao obter dimensões da venda', error)
                  }
           }

          const detalhes = [];
           if(venda){
               const { id, order_items, date_created, buyer, status, total_amount, currency_id, payments } = venda;
             for (const item of order_items) {
                 const volume = dimensions?.height && dimensions?.width && dimensions?.length ? Number((dimensions.height * dimensions.width * dimensions.length) / 6).toFixed(2) : null
                    detalhes.push({
                      venda_id: String(id),
                       order_item_id: item.item.id,
                       date_created: date_created,
                      total_amount: total_amount,
                       currency_id: currency_id,
                       buyer_id: buyer?.id,
                        buyer_nickname: buyer?.nickname,
                      status: status,
                        shipping_cost: payments?.[0]?.shipping_cost ?? 0,
                      shipping_id: String(shipping?.id ?? null),
                      height: dimensions?.height ?? null,
                      width: dimensions?.width ?? null,
                        length: dimensions?.length ?? null,
                       weight: dimensions?.weight ?? null,
                      volume: volume,
                     senders_cost: senders_cost
                 });
              }
           }
            console.log('obterDetalhesVenda: Detalhes que serão retornados', detalhes)
           return detalhes;
     } catch (error) {
          console.error('Erro ao obter detalhes da venda:', error.message);
         throw error;
     }
}
     
   async salvarDetalhesVenda(detalhes) {
        try {
             await sequelize.sync();
            // Iterar sobre cada detalhe e salvar
              for (const detalhe of detalhes) {
                 await DetalhesVenda.upsert({
                    venda_id: detalhe.venda_id,
                     order_item_id: detalhe.order_item_id,
                      date_created: detalhe.date_created,
                    total_amount: detalhe.total_amount,
                    currency_id: detalhe.currency_id,
                   buyer_id: detalhe.buyer_id,
                    buyer_nickname: detalhe.buyer_nickname,
                     status: detalhe.status,
                     shipping_cost: detalhe.shipping_cost,
                     shipping_id: detalhe.shipping_id,
                      height: detalhe.height,
                      width: detalhe.width,
                     length: detalhe.length,
                    weight: detalhe.weight,
                     volume: detalhe.volume
                 }, { where: {venda_id: detalhe.venda_id, order_item_id: detalhe.order_item_id} });
                    console.log(`Detalhes da venda ${detalhe.venda_id} com item ${detalhe.order_item_id} inseridos ou atualizados com sucesso.`);
             }
     } catch(error) {
           console.error('Erro ao salvar os detalhes das vendas:', error);
           throw error;
      }
}
}

module.exports = new DetalhesVendaService();