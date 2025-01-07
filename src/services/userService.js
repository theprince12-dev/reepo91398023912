    // src/services/userService.js
    const fetch = require('node-fetch').default;
    const config = require('../config/mercadoLivre');
    const authService = require('./authService');
     const User = require('../models/userModel');
     const sequelize = require('../config/database');

    class UserService {
         async obterDetalhesUsuario(user_id) {
             try {
                  await sequelize.sync();
                  const accessToken = await authService.getValidToken();
                 const url = `${config.api_base_url}/users/${user_id}`;
                 const response = await fetch(url, {
                     headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                   if (!response.ok) {
                       if (response.status === 401) {
                          throw new Error('Token inválido ou expirado');
                        }
                        throw new Error(`Erro ao obter detalhes do usuário: ${response.statusText}`);
                   }
                  const data = await response.json();
                  const { id, nickname, user_type, level_id, power_seller_status, transactions, metrics } = data;
                   await User.upsert({
                       id: id,
                       nickname: nickname,
                         user_type: user_type,
                         level_id: level_id,
                       power_seller_status: power_seller_status,
                       transactions_completed: transactions?.completed != null ? Number(transactions.completed) : 0, // <- Mudança aqui
                          sales_completed: metrics?.sales?.completed != null ? Number(metrics.sales.completed) : 0,  // <- Mudança aqui
                       claims_value: metrics?.claims?.value != null ? Number(metrics.claims.value) : 0,   // <- Mudança aqui
                       delayed_handling_time_value: metrics?.delayed_handling_time?.value != null ? Number(metrics.delayed_handling_time.value) : 0,  // <- Mudança aqui
                       cancellations_value: metrics?.cancellations?.value != null ? Number(metrics.cancellations.value) : 0,   // <- Mudança aqui
                   });
                  console.log(`Usuário ${id} salvo ou atualizado com sucesso no banco de dados`);
                 return data;
            } catch (error) {
               console.error('Erro ao obter detalhes do usuário:', error.message);
                throw error;
             }
        }
    }
    module.exports = new UserService();