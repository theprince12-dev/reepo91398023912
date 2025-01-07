// src/services/authService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const NodeCache = require('node-cache');

const tokenCache = new NodeCache({ stdTTL: 21600 }); // 6 horas

class AuthService {
    // Gera a URL de autorização que o usuário deve acessar
    getAuthorizationUrl() {
        const baseUrl = 'https://auth.mercadolivre.com.br/authorization';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.app_id,
            redirect_uri: config.redirect_uri,
              scope: 'offline_access'
        });
        return `${baseUrl}?${params.toString()}`;
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
            tokenCache.set('access_token', tokens.access_token, tokens.expires_in);
             tokenCache.set('refresh_token', tokens.refresh_token);
             return tokens.access_token;
        } catch (error) {
            console.error('Erro ao obter tokens iniciais:', error);
             throw error;
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

 // Obtém um token válido (renova se necessário)
async getValidToken() {
   const cachedToken = tokenCache.get('access_token');
     if (cachedToken) {
        const isValid = await this.validateCurrentToken(cachedToken);
       if (isValid) {
            return cachedToken;
       }
    }
    return await this.refreshAccessToken();
 }

// Renova o token usando refresh_token
async refreshAccessToken() {
    const cachedRefreshToken = tokenCache.get('refresh_token');

        if(!cachedRefreshToken) {
            throw new Error('Refresh token não encontrado.');
        }

        const url = 'https://api.mercadolibre.com/oauth/token';
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: config.app_id,
            client_secret: config.client_secret,
            refresh_token: cachedRefreshToken
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
                throw new Error('Falha ao renovar o token');
            }

            const tokens = await response.json();
            tokenCache.set('access_token', tokens.access_token, tokens.expires_in);
            tokenCache.set('refresh_token', tokens.refresh_token);
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
}

module.exports = new AuthService();