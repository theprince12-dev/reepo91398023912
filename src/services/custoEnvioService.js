// src/services/custoEnvioService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const sequelize = require('../config/database');

class CustoEnvioService {
    async obterCustoEnvio(shipmentId, accessToken) {
        try {
             await sequelize.sync();
             const url = `${config.api_base_url}/shipments/${shipmentId}/costs`;
                 const response = await fetch(url, {
                      headers: { 'Authorization': `Bearer ${accessToken}` }
                 });
              if (!response.ok) {
                  if (response.status === 401) {
                          throw new Error('Token inválido ou expirado');
                    }
                   throw new Error(`Erro ao obter detalhes do envio: ${response.statusText}`);
              }
              const data = await response.json();
               let senders_cost = null;
               if(data && data.senders && data.senders.length > 0)
                   senders_cost = data.senders[0]?.cost ?? null;
               console.log(`Custos de envio para o id ${shipmentId} obtido com sucesso!`, {
                    senders_cost: senders_cost
               });
                return senders_cost
         } catch (error) {
             console.error('Erro ao obter custos de envio:', error);
              throw error;
        }
    }
}

module.exports = new CustoEnvioService();