// src/services/productService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');
const authService = require('./authService');

class ProductService {
    async getProductById(productId) {
        try {
            const accessToken = await authService.getValidToken();
             const url = `${config.api_base_url}/items/${productId}`;
             const response = await fetch(url, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                throw new Error(`Erro ao obter produto: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter detalhes do produto:', error);
            throw error;
        }
    }
}
module.exports = new ProductService();