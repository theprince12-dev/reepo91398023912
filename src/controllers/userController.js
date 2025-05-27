  // src/controllers/userController.js
  const userService = require('../services/userService');
  const authService = require('../services/authService');
  const { AuthToken } = require('../../models');

  class UserController {
      async getUser(req, res, next) {
        try {
            const { user_id } = req.params;
            const user = await userService.obterDetalhesUsuario(user_id);
            res.json({
                success: true,
                user: user
            });
         } catch (error) {
            next(error);
         }
      }

      async getCurrentUser(req, res, next) {
          try {
              const result = await userService.getCurrentUser();
              res.json(result);
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao obter usuário atual: ${error.message}`
              });
          }
      }
      
      // Obter todos os tokens de usuários
      async getAllUserTokens(req, res, next) {
          try {
              console.log('getAllUserTokens: Iniciando obtenção de tokens de usuários');
              
              // Verificar se os serviços e modelos estão disponíveis
              if (!authService) {
                  throw new Error('authService não está disponível');
              }
              
              console.log('getAllUserTokens: Obtendo usuários ativos');
              let activeUsers = [];
              try {
                  activeUsers = await authService.getActiveUsers();
                  console.log(`getAllUserTokens: ${activeUsers.length} usuários ativos obtidos com sucesso`);
              } catch (activeError) {
                  console.error('Erro ao obter usuários ativos:', activeError);
                  activeUsers = [];
              }
              
              console.log('getAllUserTokens: Obtendo usuários inativos');
              let inactiveUsers = [];
              try {
                  inactiveUsers = await authService.getInactiveUsers();
                  console.log(`getAllUserTokens: ${inactiveUsers.length} usuários inativos obtidos com sucesso`);
              } catch (inactiveError) {
                  console.error('Erro ao obter usuários inativos:', inactiveError);
                  inactiveUsers = [];
              }
              
              // Verificar quantos usuários estão disponíveis
              console.log(`getAllUserTokens: Encontrados ${activeUsers.length} usuários ativos e ${inactiveUsers.length} inativos`);
              
              res.json({
                  success: true,
                  tokens: {
                      active: activeUsers || [],
                      inactive: inactiveUsers || []
                  }
              });
          } catch (error) {
              console.error('Erro em getAllUserTokens:', error);
              // Enviar um erro mais detalhado para ajudar na depuração
              res.status(500).json({
                  success: false,
                  message: `Erro ao obter tokens dos usuários: ${error.message}`,
                  stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
              });
          }
      }
      
      // Definir o usuário atual com um token específico
      async setCurrentUser(req, res, next) {
          try {
              const { user_id, access_token } = req.body;
              
              if (!user_id || !access_token) {
                  return res.status(400).json({
                      success: false,
                      message: "ID do usuário e token de acesso são obrigatórios"
                  });
              }
              
              // Validar o token
              const isValid = await authService.validateCurrentToken(access_token);
              
              if (!isValid) {
                  return res.status(400).json({
                      success: false,
                      message: "Token de acesso inválido"
                  });
              }
              
              // Salvar o token para o usuário
              await authService.saveToken({ 
                  access_token, 
                  refresh_token: '', 
                  expires_in: 21600,
                  scope: 'offline_access' 
              }, user_id);
              
              // Selecionar o usuário
              const result = await authService.selectUser(user_id);
              
              res.json(result);
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao definir usuário atual: ${error.message}`
              });
          }
      }
      
      // Obter todos os usuários ativos (com tokens válidos)
      async getActiveUsers(req, res, next) {
          try {
              const activeUsers = await authService.getActiveUsers();
              res.json({
                  success: true,
                  users: activeUsers
              });
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao obter usuários ativos: ${error.message}`
              });
          }
      }
      
      // Selecionar um usuário específico
      async selectUser(req, res, next) {
          try {
              const { user_id } = req.params;
              const result = await authService.selectUser(user_id);
              res.json(result);
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao selecionar usuário: ${error.message}`
              });
          }
      }
      
  // Obter o usuário atualmente selecionado
      async getSelectedUser(req, res, next) {
          try {
              const selectedUserId = authService.getCurrentSelectedUser();
              
              if (!selectedUserId) {
                  return res.json({
                      success: true,
                      selected: false,
                      message: "Nenhum usuário selecionado"
                  });
              }
              
              // Obter informações do usuário selecionado
              const accessToken = await authService.getTokenForUser(selectedUserId);
              if (!accessToken) {
                  return res.json({
                      success: false,
                      message: "Token do usuário selecionado não está disponível"
                  });
              }
              
              const userData = await authService.getUserInfo(accessToken);
              
              res.json({
                  success: true,
                  selected: true,
                  user: userData
              });
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao obter usuário selecionado: ${error.message}`
              });
          }
      }
      
      // Obter usuários com tokens expirados
      async getInactiveUsers(req, res, next) {
          try {
              const inactiveUsers = await authService.getInactiveUsers();
              res.json({
                  success: true,
                  users: inactiveUsers
              });
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao obter usuários inativos: ${error.message}`
              });
          }
      }
      
      // Renovar token de um usuário específico
      async refreshUserToken(req, res, next) {
          try {
              const { user_id } = req.params;
              const result = await authService.refreshTokenForUser(user_id);
              res.json(result);
          } catch (error) {
              res.status(500).json({
                  success: false,
                  message: `Erro ao renovar token do usuário: ${error.message}`
              });
          }
      }
  }

  module.exports = new UserController();
