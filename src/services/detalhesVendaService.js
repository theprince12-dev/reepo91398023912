// src/services/detalhesVendaService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const DimensaoPacoteService = require('./dimensaoPacoteService');
const DetalhesVenda = require('../models/detalhesVendaModel');
const sequelize = require('../config/database');

class DetalhesVendaService {
    async obterDetalhesVenda(venda_id) {
        try {
             await sequelize.sync();
             const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/orders/${venda_id}`;
               const response = await fetch(url, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
             });
            if (!response.ok) {
                   if (response.status === 401) {
                        throw new Error('Token inválido ou expirado');
                    }
                    throw new Error(`Erro ao obter detalhes da venda: ${response.statusText}`);
                }
              const detalhesVenda = await response.json();
               const detalhes = [];
               const { shipping, id, order_items, date_created, buyer, status, total_amount, currency_id, payments } = detalhesVenda;
               let dimensions = null;
                if(shipping){
                     try{
                        const dimensaoPacoteService = new DimensaoPacoteService(); // <-- Mudança aqui
                         dimensions = await dimensaoPacoteService.obterDimensaoPacote(shipping.id);
                     } catch(error){
                          console.error('Erro ao obter dimensões da venda', error)
                     }
                }

              // Iterar sobre os itens do pedido
             for (const item of order_items) {
                detalhes.push({
                     venda_id: String(id),
                     order_item_id: item.item.id, // Capturando o order_item_id
                      date_created: date_created,
                      total_amount: total_amount,
                     currency_id: currency_id,
                      buyer_id: buyer?.id,
                    buyer_nickname: buyer?.nickname,
                      status: status,
                     shipping_cost: payments?.[0]?.shipping_cost ?? 0, // Capturando o shipping_cost
                     shipping_id: String(shipping?.id ?? null),
                      height: dimensions?.height ?? null,
                      width: dimensions?.width ?? null,
                      length: dimensions?.length ?? null,
                      weight: dimensions?.weight ?? null,
                 });
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
        // Verificação de tipo antes de iterar
        if (!Array.isArray(detalhes)) {
            console.error("Detalhes não é um array, não será iterado:", detalhes);
            return; // Sai da função sem iterar se não for um array
        }


        for (const detalhe of detalhes) {
            const {
              venda_id,
              order_item_id,
              date_created,
              total_amount,
              currency_id,
              buyer_id,
              buyer_nickname,
              status,
              shipping_cost,
              shipping_id,
              height,
              width,
              length,
              weight,
            } = detalhe;
    
              await DetalhesVenda.findOrCreate({
              where: { order_item_id },
                defaults: {
                venda_id,
                order_item_id,
                date_created,
                total_amount,
                currency_id,
                buyer_id,
                buyer_nickname,
                status,
                shipping_cost,
                shipping_id,
                height,
                width,
                length,
                weight,
                },
               });
          }

    } catch (error) {
        console.error("Erro ao salvar os detalhes das vendas:", error);
         throw error;
     }
}
}

module.exports = new DetalhesVendaService();