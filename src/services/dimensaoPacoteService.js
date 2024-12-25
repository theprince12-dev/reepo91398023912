// src/services/dimensaoPacoteService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
 const DimensaoPacote = require('../models/dimensaoPacoteModel');
   const sequelize = require('../config/database');

   class DimensaoPacoteService {
        async obterDimensaoPacote(shipmentId) {
           try {
                await sequelize.sync();
                 const accessToken = await authService.getValidToken();
                const url = `${config.api_base_url}/shipments/${shipmentId}/items`;
                    console.log('obterDimensaoPacote: URL da requisição - ', url);
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
                    let dimensions = null
                    if(data && data.length > 0 && data[0]?.dimensions) {
                      dimensions = data[0].dimensions;
                       console.log('obterDimensaoPacote: Resposta da API - ', dimensions);
                     }
              await DimensaoPacote.upsert({
                   shipment_id: shipmentId,
                  height: dimensions?.height ?? null,
                   width: dimensions?.width ?? null,
                  length: dimensions?.length ?? null,
                  weight: dimensions?.weight ?? null
              }, { where: {shipment_id: shipmentId}});
                 console.log(`Dimensões do pacote ${shipmentId} obtidas com sucesso`);
                return dimensions;
            } catch (error) {
               console.error('Erro ao obter dados do envio:', error);
               throw error;
            }
     }
 }

module.exports = new DimensaoPacoteService();