// src/services/authService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');
const NodeCache = require('node-cache');
const { AuthToken, User } = require('../../models');
const { Op } = require('sequelize');

const tokenCache = new NodeCache({ stdTTL: 21600 }); // 6 horas
const sessionCache = new NodeCache({ stdTTL: 86400 }); // 24 horas para seleção de usuário

class AuthService {
    // Gera a URL de autorização que o usuário deve acessar
    getAuthorizationUrl() {
        const baseUrl = 'https://auth.mercadolivre.com.br/authorization';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.app_id,
            redirect_uri: config.redirect_uri,
            // Escopo simplificado para autenticação
            scope: 'offline_access'
        });
        return `${baseUrl}?${params.toString()}`;
    }

    // Salva o token no banco de dados
    async saveToken(tokenData, userId = null) {
        console.log('saveToken: Salvando token no banco de dados');
        try {
            // Calcular data de expiração
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
            
            // Desativar outros tokens ativos para este usuário
            if (userId) {
                await AuthToken.update(
                    { is_active: false }, 
                    { 
                        where: { 
                            user_id: userId, 
                            is_active: true 
                        } 
                    }
                );
            }
            
            // Criar novo token
            const token = await AuthToken.create({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                token_type: tokenData.token_type || 'bearer',
                expires_at: expiresAt,
                scope: tokenData.scope,
                user_id: userId,
                is_active: true
            });
            
            console.log(`saveToken: Token salvo com ID ${token.id}`);
            return token;
        } catch (error) {
            console.error('Erro ao salvar token no banco de dados:', error);
            throw error;
        }
    }
    
    // Obtém tokens iniciais usando o código de autorização
    async getInitialTokens(authorizationCode) {
        const url = 'https://api.mercadolibre.com/oauth/token';
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.app_id,
            client_secret: config.client_secret,
            code: authorizationCode,
            redirect_uri: config.redirect_uri
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: body.toString()
            });

            if (!response.ok) {
                throw new Error(`Erro na obtenção dos tokens: ${response.statusText}`);
            }

            const tokens = await response.json();
            
            // Armazenar no cache
            tokenCache.set('access_token', tokens.access_token, tokens.expires_in);
            tokenCache.set('refresh_token', tokens.refresh_token);
            
            // Obter ID do usuário
            const userData = await this.getUserInfo(tokens.access_token);
            const userId = userData?.id;
            
            // Salvar no banco de dados
            await this.saveToken(tokens, userId);
            
            return tokens.access_token;
        } catch (error) {
            console.error('Erro ao obter tokens iniciais:', error);
            throw error;
        }
    }
    
    // Obter informações do usuário autenticado
    async getUserInfo(accessToken) {
        try {
            const response = await fetch('https://api.mercadolibre.com/users/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao obter informações do usuário: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter informações do usuário:', error);
            return null;
        }
    }

    // Verifica se o token atual é válido
    async validateCurrentToken(token) {
        console.log('validateCurrentToken: Validando token:', token);
        try {
            const response = await fetch('https://api.mercadolibre.com/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const body = await response.json();
            console.log('validateCurrentToken: Scopes do token:', body.scopes);
            if (response.status === 200) {
               return true;
           }
            return false;
        } catch (error) {
            console.error('Erro ao validar token:', error);
           throw { name: 'TokenError', message: error.message };
       }
    }

    // Obtém um token válido do banco de dados
    async getDbToken() {
        try {
            // Buscar token ativo e não expirado
            const token = await AuthToken.findOne({
                where: {
                    is_active: true,
                    expires_at: {
                        [Op.gt]: new Date() // Não expirado
                    }
                },
                order: [['created_at', 'DESC']] // O mais recente
            });
            
            if (!token) {
                console.log('getDbToken: Nenhum token válido encontrado no banco de dados');
                return null;
            }
            
            console.log(`getDbToken: Token encontrado no banco de dados, expira em ${token.getTimeRemaining()}s`);
            return token;
        } catch (error) {
            console.error('Erro ao buscar token no banco de dados:', error);
            return null;
        }
    }

    // Obtém um token válido (renova se necessário)
    async getValidToken() {
        // 1. Primeiro verificar o cache (mais rápido)
        const cachedToken = tokenCache.get('access_token');
        if (cachedToken) {
            const isValid = await this.validateCurrentToken(cachedToken);
            if (isValid) {
                return cachedToken;
            }
        }
        
        // 2. Verificar no banco de dados
        const dbToken = await this.getDbToken();
        if (dbToken) {
            // Atualizar o cache com o token do banco
            tokenCache.set('access_token', dbToken.access_token, dbToken.getTimeRemaining());
            tokenCache.set('refresh_token', dbToken.refresh_token);
            
            // Validar token do banco
            const isValid = await this.validateCurrentToken(dbToken.access_token);
            if (isValid) {
                return dbToken.access_token;
            }
        }
        
        // 3. Tentar renovar o token
        return await this.refreshAccessToken();
    }

    // Renova o token usando refresh_token
    async refreshAccessToken() {
        // Tentar obter refresh token do cache primeiro
        let refreshToken = tokenCache.get('refresh_token');
        
        // Se não tiver no cache, buscar do banco de dados
        if (!refreshToken) {
            const dbToken = await AuthToken.findOne({
                where: { is_active: true },
                order: [['created_at', 'DESC']]
            });
            
            if (dbToken) {
                refreshToken = dbToken.refresh_token;
            }
        }
        
        if (!refreshToken) {
            throw new Error('Refresh token não encontrado em cache ou banco de dados.');
        }
        
        const url = 'https://api.mercadolibre.com/oauth/token';
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: config.app_id,
            client_secret: config.client_secret,
            refresh_token: refreshToken
        });
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: body.toString()
            });
            
            if (!response.ok) {
                throw new Error(`Falha ao renovar o token: ${response.statusText}`);
            }
            
            const tokens = await response.json();
            
            // Atualizar cache
            tokenCache.set('access_token', tokens.access_token, tokens.expires_in);
            tokenCache.set('refresh_token', tokens.refresh_token);
            
            // Obter ID do usuário
            const userData = await this.getUserInfo(tokens.access_token);
            const userId = userData?.id;
            
            // Salvar no banco de dados
            await this.saveToken(tokens, userId);
            
            return tokens.access_token;
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            throw error;
        }
    }
 // Obtem o seller id
     async obterSellerId(accessToken) {
        try {
            const response = await fetch('https://api.mercadolibre.com/users/me', {
               method: 'GET',
                headers: {
                   'Authorization': `Bearer ${accessToken}`
               }
           });
           const userData = await response.json();

            return userData.id;
        } catch (error) {
            console.error('Erro ao obter Seller ID:', error);
           return null;
        }
    }
    
    // Método para obter todos os usuários ativos
    async getActiveUsers() {
        try {
            console.log('getActiveUsers: Buscando tokens ativos no banco de dados');
            
            // Buscar todos os tokens, agrupados por user_id
            const tokens = await AuthToken.findAll({
                where: {
                    user_id: {
                        [Op.ne]: null
                    }
                },
                order: [['user_id', 'ASC'], ['created_at', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user',
                        required: false  // LEFT JOIN
                    }
                ]
            });
            
            console.log(`getActiveUsers: Encontrados ${tokens.length} tokens totais no banco`);
            
            // Filtrar tokens ativos e válidos por usuário
            // Agrupar por user_id para ter apenas um token por usuário (o mais recente)
            const userTokenMap = new Map();
            tokens.forEach(token => {
                // Verificar se não existe token para este usuário ou se este token é mais recente
                const existingToken = userTokenMap.get(token.user_id);
                if (!existingToken || new Date(token.created_at) > new Date(existingToken.created_at)) {
                    userTokenMap.set(token.user_id, token);
                }
            });
            
            console.log(`getActiveUsers: Tokens agrupados por usuário: ${userTokenMap.size} usuários únicos`);
            
            // Filtrar apenas usuários com tokens válidos
            const activeUserTokens = Array.from(userTokenMap.values())
                .filter(token => !token.isExpired() && token.is_active);
            
            console.log(`getActiveUsers: ${activeUserTokens.length} usuários com tokens ativos e válidos`);
            
            // Converter para array de resultados
            const result = [];
            for (const token of activeUserTokens) {
                const userId = token.user_id;
                // Se não tiver usuário associado, buscar as informações
                let userData = token.user;
                if (!userData) {
                    try {
                        // Validar token e obter informações do usuário
                        const isValid = await this.validateCurrentToken(token.access_token);
                        if (isValid) {
                            userData = await this.getUserInfo(token.access_token);
                        }
                    } catch (error) {
                        console.error(`Erro ao obter dados do usuário ${userId}:`, error);
                    }
                }
                
                result.push({
                    id: userId,
                    nickname: userData?.nickname || `Usuário ${userId}`,
                    user_type: userData?.user_type || 'desconhecido',
                    level_id: userData?.seller_reputation?.level_id || 'desconhecido',
                    token: {
                        id: token.id,
                        expires_at: token.expires_at,
                        time_remaining: token.getTimeRemaining()
                    },
                    selected: this.isUserSelected(userId)
                });
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao obter usuários ativos:', error);
            throw error;
        }
    }
    
    // Selecionar um usuário específico
    async selectUser(userId) {
        try {
            // 1. Primeiro verificar se o usuário tem algum token (mesmo expirado)
            const existingToken = await AuthToken.findOne({
                where: {
                    user_id: userId,
                    is_active: true
                },
                order: [['created_at', 'DESC']]
            });
            
            // Se não tem token, retornar erro
            if (!existingToken) {
                throw new Error(`Usuário ${userId} não possui token cadastrado`);
            }
            
            // 2. Verificar se o token está válido (não expirado)
            let token = existingToken;
            if (existingToken.isExpired()) {
                console.log(`Token para usuário ${userId} está expirado. Tentando renovar...`);
                
                // 3. Tentar renovar o token
                const refreshResult = await this.refreshTokenForUser(userId);
                
                if (!refreshResult.success) {
                    throw new Error(`Não foi possível renovar o token para o usuário ${userId}: ${refreshResult.message}`);
                }
                
                // 4. Buscar o token renovado
                token = await AuthToken.findOne({
                    where: {
                        user_id: userId,
                        is_active: true,
                        expires_at: {
                            [Op.gt]: new Date()
                        }
                    },
                    order: [['created_at', 'DESC']]
                });
            }
            
            // 5. Armazenar seleção no cache
            sessionCache.set('selected_user_id', userId);
            
            // 6. Atualizar cache de token com o token do usuário selecionado
            tokenCache.set('access_token', token.access_token, token.getTimeRemaining());
            tokenCache.set('refresh_token', token.refresh_token);
            
            // 7. Obter informações do usuário para retornar
            const userData = await this.getUserInfo(token.access_token);
            
            return {
                success: true,
                user: userData,
                message: `Usuário ${userData?.nickname || userId} selecionado com sucesso`
            };
        } catch (error) {
            console.error(`Erro ao selecionar usuário ${userId}:`, error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Obter o usuário atualmente selecionado
    getCurrentSelectedUser() {
        return sessionCache.get('selected_user_id') || null;
    }
    
    // Verificar se um usuário está selecionado
    isUserSelected(userId) {
        const selectedId = this.getCurrentSelectedUser();
        return selectedId === userId;
    }
    
    // Obter usuários com tokens expirados mas com refresh token
    async getInactiveUsers() {
        try {
            console.log('getInactiveUsers: Buscando todos os tokens no banco de dados');
            
            // Buscar todos os tokens
            const tokens = await AuthToken.findAll({
                where: {
                    user_id: {
                        [Op.ne]: null
                    }
                },
                order: [['user_id', 'ASC'], ['created_at', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user',
                        required: false
                    }
                ]
            });
            
            console.log(`getInactiveUsers: Encontrados ${tokens.length} tokens totais no banco`);
            
            // Agrupar por user_id para ter apenas um token por usuário (o mais recente)
            const userTokenMap = new Map();
            tokens.forEach(token => {
                // Verificar se não existe token para este usuário ou se este token é mais recente
                const existingToken = userTokenMap.get(token.user_id);
                if (!existingToken || new Date(token.created_at) > new Date(existingToken.created_at)) {
                    userTokenMap.set(token.user_id, token);
                }
            });
            
            console.log(`getInactiveUsers: Tokens agrupados por usuário: ${userTokenMap.size} usuários únicos`);
            
            // Filtrar apenas usuários com tokens expirados ou inativos
            const inactiveUserTokens = Array.from(userTokenMap.values())
                .filter(token => token.isExpired() || !token.is_active);
            
            console.log(`getInactiveUsers: ${inactiveUserTokens.length} usuários com tokens expirados ou inativos`);
            
            // Converter para array
            const result = [];
            for (const token of inactiveUserTokens) {
                const userId = token.user_id;
                // Se não tiver usuário associado, buscar as informações
                let userData = token.user;
                if (!userData) {
                    try {
                        // Tentar obter informações básicas do usuário se disponíveis
                        userData = { id: userId, nickname: `Usuário ${userId}` };
                    } catch (error) {
                        console.error(`Erro ao obter dados do usuário ${userId}:`, error);
                    }
                }
                
                result.push({
                    id: userId,
                    nickname: userData?.nickname || `Usuário ${userId}`,
                    user_type: userData?.user_type || 'desconhecido',
                    level_id: userData?.seller_reputation?.level_id || 'desconhecido',
                    token: {
                        id: token.id,
                        expires_at: token.expires_at,
                        time_expired: Math.abs(token.getTimeRemaining()) // Tempo em segundos desde que expirou
                    }
                });
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao obter usuários inativos:', error);
            throw error;
        }
    }
    
    // Tentar renovar o token de um usuário específico
    async refreshTokenForUser(userId) {
        try {
            // Buscar o token mais recente para este usuário
            const token = await AuthToken.findOne({
                where: {
                    user_id: userId
                },
                order: [['created_at', 'DESC']]
            });
            
            if (!token) {
                throw new Error(`Nenhum token encontrado para o usuário ${userId}`);
            }
            
            // Tentar renovar usando o refresh token
            const url = 'https://api.mercadolibre.com/oauth/token';
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: config.app_id,
                client_secret: config.client_secret,
                refresh_token: token.refresh_token
            });
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: body.toString()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Falha ao renovar o token: ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`);
            }
            
            const tokens = await response.json();
            
            // Atualizar cache se esse for o usuário selecionado
            if (this.isUserSelected(userId)) {
                tokenCache.set('access_token', tokens.access_token, tokens.expires_in);
                tokenCache.set('refresh_token', tokens.refresh_token);
            }
            
            // Salvar no banco de dados
            await this.saveToken(tokens, userId);
            
            // Obter informações do usuário para retornar
            const userData = await this.getUserInfo(tokens.access_token);
            
            return {
                success: true,
                user: userData,
                message: `Token renovado com sucesso para ${userData?.nickname || userId}`
            };
        } catch (error) {
            console.error(`Erro ao renovar token para usuário ${userId}:`, error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Obter token para um usuário específico
    async getTokenForUser(userId) {
        try {
            const token = await AuthToken.findOne({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        [Op.gt]: new Date()
                    }
                },
                order: [['created_at', 'DESC']]
            });
            
            if (!token) {
                return null;
            }
            
            return token.access_token;
        } catch (error) {
            console.error(`Erro ao obter token para usuário ${userId}:`, error);
            return null;
        }
    }
}

module.exports = new AuthService();
