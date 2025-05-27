// src/services/categoryService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');
const authService = require('./authService');

/**
 * Serviço para gerenciar categorias do Mercado Livre
 * Documentação: https://developers.mercadolivre.com.br/pt_br/categorizacao-de-produtos
 */
class CategoryService {
    /**
     * Obtém todas as categorias raiz do Mercado Livre
     * @param {string} siteId - ID do site (default: MLB para Brasil)
     * @returns {Promise<Array>} - Lista de categorias
     */
    async getAllCategories(siteId = 'MLB') {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/sites/${siteId}/categories`;
            
            console.log(`getAllCategories: Buscando categorias para site ${siteId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getAllCategories: Erro ${response.status} ao buscar categorias:`, errorData);
                throw new Error(`Erro ao buscar categorias: ${errorData.message || response.statusText}`);
            }
            
            const categories = await response.json();
            console.log(`getAllCategories: ${categories.length} categorias encontradas`);
            return categories;
        } catch (error) {
            console.error('getAllCategories: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter categorias: ${error.message}`);
        }
    }

    /**
     * Obtém detalhes de uma categoria específica
     * @param {string} categoryId - ID da categoria
     * @returns {Promise<Object>} - Detalhes da categoria
     */
    async getCategoryById(categoryId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/categories/${categoryId}`;
            
            console.log(`getCategoryById: Buscando categoria ${categoryId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getCategoryById: Erro ${response.status} ao buscar categoria ${categoryId}:`, errorData);
                throw new Error(`Erro ao buscar categoria ${categoryId}: ${errorData.message || response.statusText}`);
            }
            
            const category = await response.json();
            console.log(`getCategoryById: Categoria ${categoryId} encontrada`);
            return category;
        } catch (error) {
            console.error(`getCategoryById: Erro para categoria ${categoryId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter categoria ${categoryId}: ${error.message}`);
        }
    }

    /**
     * Obtém atributos de uma categoria
     * @param {string} categoryId - ID da categoria
     * @returns {Promise<Array>} - Lista de atributos da categoria
     */
    async getCategoryAttributes(categoryId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/categories/${categoryId}/attributes`;
            
            console.log(`getCategoryAttributes: Buscando atributos para categoria ${categoryId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getCategoryAttributes: Erro ${response.status} ao buscar atributos da categoria ${categoryId}:`, errorData);
                throw new Error(`Erro ao buscar atributos da categoria ${categoryId}: ${errorData.message || response.statusText}`);
            }
            
            const attributes = await response.json();
            console.log(`getCategoryAttributes: ${attributes.length} atributos encontrados para categoria ${categoryId}`);
            return attributes;
        } catch (error) {
            console.error(`getCategoryAttributes: Erro para categoria ${categoryId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter atributos da categoria ${categoryId}: ${error.message}`);
        }
    }

    /**
     * Obtém tendências de categorias
     * @param {string} siteId - ID do site (default: MLB para Brasil)
     * @returns {Promise<Array>} - Lista de tendências
     */
    async getCategoryTrends(siteId = 'MLB') {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/trends/${siteId}`;
            
            console.log(`getCategoryTrends: Buscando tendências para site ${siteId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getCategoryTrends: Erro ${response.status} ao buscar tendências:`, errorData);
                throw new Error(`Erro ao buscar tendências: ${errorData.message || response.statusText}`);
            }
            
            const trends = await response.json();
            console.log(`getCategoryTrends: ${trends.length} tendências encontradas`);
            return trends;
        } catch (error) {
            console.error('getCategoryTrends: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter tendências: ${error.message}`);
        }
    }

    /**
     * Obtém as categorias filhas de uma categoria específica
     * @param {string} categoryId - ID da categoria pai
     * @returns {Promise<Array>} - Lista de categorias filhas
     */
    async getChildCategories(categoryId) {
        try {
            const category = await this.getCategoryById(categoryId);
            
            if (category && category.children_categories) {
                console.log(`getChildCategories: ${category.children_categories.length} categorias filhas encontradas para ${categoryId}`);
                return category.children_categories;
            }
            
            console.log(`getChildCategories: Nenhuma categoria filha encontrada para ${categoryId}`);
            return [];
        } catch (error) {
            console.error(`getChildCategories: Erro para categoria ${categoryId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter categorias filhas de ${categoryId}: ${error.message}`);
        }
    }

    /**
     * Obtém a árvore completa de categorias a partir de uma categoria raiz
     * @param {string} categoryId - ID da categoria raiz (opcional)
     * @param {string} siteId - ID do site (default: MLB para Brasil)
     * @returns {Promise<Array>} - Árvore de categorias
     */
    async getCategoryTree(categoryId = null, siteId = 'MLB') {
        try {
            let rootCategories;
            
            if (categoryId) {
                // Se um ID de categoria for fornecido, obtenha apenas essa categoria e suas filhas
                const category = await this.getCategoryById(categoryId);
                rootCategories = [category];
            } else {
                // Caso contrário, obtenha todas as categorias raiz
                rootCategories = await this.getAllCategories(siteId);
            }
            
            // Para cada categoria raiz, obtenha recursivamente suas subcategorias
            const categoryTree = await Promise.all(rootCategories.map(async (rootCategory) => {
                const childCategories = await this.getChildCategories(rootCategory.id);
                
                // Se houver categorias filhas, obtenha recursivamente suas subcategorias
                if (childCategories && childCategories.length > 0) {
                    const children = await Promise.all(childCategories.map(async (childCategory) => {
                        return {
                            ...childCategory,
                            children: await this.getChildCategories(childCategory.id)
                        };
                    }));
                    
                    return {
                        ...rootCategory,
                        children
                    };
                }
                
                return rootCategory;
            }));
            
            console.log(`getCategoryTree: Árvore de categorias construída com ${categoryTree.length} categorias raiz`);
            return categoryTree;
        } catch (error) {
            console.error('getCategoryTree: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter árvore de categorias: ${error.message}`);
        }
    }

    /**
     * Verifica se um produto é compatível com uma categoria
     * @param {Object} productData - Dados do produto
     * @param {string} categoryId - ID da categoria
     * @returns {Promise<Object>} - Resultado da validação
     */
    async validateProductCategory(productData, categoryId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/categories/${categoryId}/validate`;
            
            console.log(`validateProductCategory: Validando produto para categoria ${categoryId}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const validationResult = await response.json();
            
            if (!response.ok) {
                console.error(`validateProductCategory: Erro ${response.status} ao validar produto para categoria ${categoryId}:`, validationResult);
                return {
                    valid: false,
                    errors: validationResult.cause || validationResult.message || 'Erro desconhecido'
                };
            }
            
            console.log(`validateProductCategory: Produto validado com sucesso para categoria ${categoryId}`);
            return {
                valid: true,
                result: validationResult
            };
        } catch (error) {
            console.error(`validateProductCategory: Erro para categoria ${categoryId}:`, error);
            if (error.name === 'TokenError') throw error;
            return {
                valid: false,
                errors: error.message
            };
        }
    }

    /**
     * Obtém as compatibilidades de autopeças para uma categoria
     * @param {string} categoryId - ID da categoria
     * @returns {Promise<Array>} - Lista de compatibilidades
     */
    async getAutoPartsCompatibilities(categoryId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/categories/${categoryId}/compatible_vehicles`;
            
            console.log(`getAutoPartsCompatibilities: Buscando compatibilidades para categoria ${categoryId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getAutoPartsCompatibilities: Erro ${response.status} ao buscar compatibilidades:`, errorData);
                throw new Error(`Erro ao buscar compatibilidades: ${errorData.message || response.statusText}`);
            }
            
            const compatibilities = await response.json();
            console.log(`getAutoPartsCompatibilities: Compatibilidades obtidas para categoria ${categoryId}`);
            return compatibilities;
        } catch (error) {
            console.error(`getAutoPartsCompatibilities: Erro para categoria ${categoryId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter compatibilidades para categoria ${categoryId}: ${error.message}`);
        }
    }

    /**
     * Obtém os domínios de produtos para autopeças
     * @param {string} domain - Domínio específico (opcional)
     * @returns {Promise<Array>} - Lista de domínios
     */
    async getAutoPartsDomains(domain = null) {
        try {
            const accessToken = await authService.getValidToken();
            let url = `${config.api_base_url}/domains/MLB-VEHICLE_PARTS`;
            
            if (domain) {
                url = `${config.api_base_url}/domains/MLB-VEHICLE_PARTS-${domain}`;
            }
            
            console.log(`getAutoPartsDomains: Buscando domínios de autopeças`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getAutoPartsDomains: Erro ${response.status} ao buscar domínios:`, errorData);
                throw new Error(`Erro ao buscar domínios: ${errorData.message || response.statusText}`);
            }
            
            const domains = await response.json();
            console.log(`getAutoPartsDomains: Domínios obtidos com sucesso`);
            return domains;
        } catch (error) {
            console.error('getAutoPartsDomains: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter domínios de autopeças: ${error.message}`);
        }
    }
}

module.exports = new CategoryService();
