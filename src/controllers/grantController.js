    // src/controllers/grantController.js
    const grantService = require('../services/grantService');
    const authService = require('../services/authService')

    class GrantController {
    async getAllGrants(req, res) {
        console.log('getAllGrants: Iniciando método');
           try {
                 console.log('getAllGrants: Obtendo token de acesso');
               const accessToken = await authService.getValidToken();
               console.log('getAllGrants: Token de acesso obtido:', accessToken);
                const grants = await grantService.obterGrants(accessToken)
                console.log('getAllGrants: grants obtidos com sucesso')
                res.status(200).json({ message: 'Grants obtidos com sucesso', grants });
          } catch(error) {
              console.error('getAllGrants: Erro ao obter os grants:', error);
                res.status(500).json({ error: 'Erro ao obter os grants', message: error.message });
          }
            finally{
                console.log('getAllGrants: Método finalizado.');
            }
        }
    }

    module.exports = new GrantController();