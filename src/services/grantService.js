// src/services/grantService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const { Grant } = require('../../models');

class GrantService {
    async obterGrants(accessToken) {
        console.log('obterGrants: Iniciando método');
      try {
           const appId = config.app_id;
            const url = `${config.api_base_url}/applications/${appId}/grants`;
          console.log('obterGrants: URL da requisição:', url);

           const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
             });

           if (!response.ok) {
                 console.error('obterGrants: requisição retornou erro');
                throw new Error(`Erro ao obter grants: ${response.statusText}`);
           }

           const data = await response.json();
            console.log('obterGrants: Resposta da requisição:', data);

             const grants = data?.grants || []
           if(grants.length > 0){
             await this.persistirGrants(grants)
            }
            return grants;

       } catch (error) {
          console.error('obterGrants: Erro ao obter grants:', error);
         throw error;
       }
      finally{
            console.log('obterGrants: Método finalizado.');
         }
    }
    async persistirGrants(grants){
    console.log('persistirGrants: Iniciando método');
         try {
            for (const grant of grants) {
              const {user_id, app_id, date_created, scopes} = grant
                const authorized = scopes.reduce((acc, scope) => {
                     if (scope === 'read') return acc + 'r';
                    if (scope === 'write') return acc + 'w';
                    if (scope === 'offline_access') return acc + 'o';
                    return acc
                 }, '')
                await Grant.upsert({
                    user_id: user_id,
                    application_id: app_id,
                    date_created: date_created,
                     authorized: authorized
                });
                console.log(`persistirGrants: Grant para o user ${user_id} persistido com sucesso`)
            }
            console.log('persistirGrants: Grant persistidos com sucesso')
         } catch(error){
             console.error('persistirGrants: Erro ao persistir os grants:', error);
                throw error;
         }
         finally{
               console.log('persistirGrants: Método finalizado.');
         }
    }
}

module.exports = new GrantService();