// src/controllers/categoryController.js
const categoryService = require('../services/categoryService');

/**
 * Controlador para gerenciar categorias do Mercado Livre
 */
class CategoryController {
    /**
     * Obtém todas as categorias raiz do Mercado Livre
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com as categorias
     */
    async getAllCategories(req, res) {
        try {
            const { site_id } = req.query;
            const categories = await categoryService.getAllCategories(site_id || 'MLB');
            return res.status(200).json(categories);
        } catch (error) {
            console.error('getAllCategories: Erro:', error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém detalhes de uma categoria específica
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com os detalhes da categoria
     */
    async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id);
            return res.status(200).json(category);
        } catch (error) {
            console.error(`getCategoryById: Erro para categoria ${req.params.id}:`, error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém atributos de uma categoria
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com os atributos da categoria
     */
    async getCategoryAttributes(req, res) {
        try {
            const { id } = req.params;
            const attributes = await categoryService.getCategoryAttributes(id);
            return res.status(200).json(attributes);
        } catch (error) {
            console.error(`getCategoryAttributes: Erro para categoria ${req.params.id}:`, error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém tendências de categorias
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com as tendências
     */
    async getCategoryTrends(req, res) {
        try {
            const { site_id } = req.query;
            const trends = await categoryService.getCategoryTrends(site_id || 'MLB');
            return res.status(200).json(trends);
        } catch (error) {
            console.error('getCategoryTrends: Erro:', error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém as categorias filhas de uma categoria específica
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com as categorias filhas
     */
    async getChildCategories(req, res) {
        try {
            const { id } = req.params;
            const childCategories = await categoryService.getChildCategories(id);
            return res.status(200).json(childCategories);
        } catch (error) {
            console.error(`getChildCategories: Erro para categoria ${req.params.id}:`, error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém a árvore completa de categorias
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com a árvore de categorias
     */
    async getCategoryTree(req, res) {
        try {
            const { id, site_id } = req.query;
            const categoryTree = await categoryService.getCategoryTree(id || null, site_id || 'MLB');
            return res.status(200).json(categoryTree);
        } catch (error) {
            console.error('getCategoryTree: Erro:', error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Valida um produto para uma categoria
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com o resultado da validação
     */
    async validateProductCategory(req, res) {
        try {
            const { id } = req.params;
            const productData = req.body;
            
            if (!productData) {
                return res.status(400).json({ error: 'Dados do produto não fornecidos' });
            }
            
            const validationResult = await categoryService.validateProductCategory(productData, id);
            
            if (validationResult.valid) {
                return res.status(200).json(validationResult);
            } else {
                return res.status(422).json(validationResult);
            }
        } catch (error) {
            console.error(`validateProductCategory: Erro para categoria ${req.params.id}:`, error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém as compatibilidades de autopeças para uma categoria
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com as compatibilidades
     */
    async getAutoPartsCompatibilities(req, res) {
        try {
            const { id } = req.params;
            const compatibilities = await categoryService.getAutoPartsCompatibilities(id);
            return res.status(200).json(compatibilities);
        } catch (error) {
            console.error(`getAutoPartsCompatibilities: Erro para categoria ${req.params.id}:`, error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém os domínios de produtos para autopeças
     * @param {Object} req - Objeto de requisição
     * @param {Object} res - Objeto de resposta
     * @returns {Object} - Resposta JSON com os domínios
     */
    async getAutoPartsDomains(req, res) {
        try {
            const { domain } = req.query;
            const domains = await categoryService.getAutoPartsDomains(domain || null);
            return res.status(200).json(domains);
        } catch (error) {
            console.error('getAutoPartsDomains: Erro:', error);
            if (error.name === 'TokenError') {
                return res.status(401).json({ message: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CategoryController();
