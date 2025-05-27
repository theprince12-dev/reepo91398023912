// src/controllers/validacaoFreteController.js
const { ValidacaoPacote, DetalhesVenda, DimensaoPacote } = require('../../models');
const validacaoFreteService = require('../services/validacaoFreteService');
const authService = require('../services/authService');
const { Op } = require('sequelize');

/**
 * Controller for handling freight validation operations
 */
class ValidacaoFreteController {
    
    /**
     * Get all freight validations with pagination and filtering
     */
    async getValidations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            // Build filter conditions based on query parameters
            const whereConditions = {};
            
            if (req.query.status) {
                whereConditions.status_validacao = req.query.status;
            }
            
            if (req.query.shipping_id) {
                whereConditions.shipping_id = req.query.shipping_id;
            }
            
            if (req.query.venda_id) {
                whereConditions.venda_id = req.query.venda_id;
            }
            
            // Query with pagination
            const { count, rows } = await ValidacaoPacote.findAndCountAll({
                where: whereConditions,
                limit,
                offset,
                order: [['data_validacao', 'DESC']]
            });
            
            // Return data with pagination info
            res.json({
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                validations: rows
            });
        } catch (error) {
            console.error('Error fetching validations:', error);
            res.status(500).json({ 
                error: 'Error fetching validations', 
                details: error.message 
            });
        }
    }
    
    /**
     * Get validation details for a specific shipment
     */
    async getValidationDetails(req, res) {
        try {
            const { shipping_id } = req.params;
            
            // Get validation record
            const validation = await ValidacaoPacote.findByPk(shipping_id);
            
            if (!validation) {
                return res.status(404).json({ error: 'Validation not found' });
            }
            
            // Get detailed item information
            let itemDetails = [];
            
            // Parse item IDs
            let itemIds;
            try {
                itemIds = typeof validation.item_ids === 'string' 
                    ? JSON.parse(validation.item_ids) 
                    : validation.item_ids;
            } catch (e) {
                console.error('Error parsing item_ids:', e);
                itemIds = [];
            }
            
            // Fetch detailed information for each item
            if (Array.isArray(itemIds) && itemIds.length > 0) {
                // Get venda details for these items
                const detalhesVendas = await DetalhesVenda.findAll({
                    where: {
                        order_item_id: { [Op.in]: itemIds },
                        shipping_id: shipping_id
                    },
                    raw: true
                });
                
                // Get dimensões do pacote pelo shipping_id
                const dimensao = await DimensaoPacote.findOne({
                    where: {
                        shipment_id: shipping_id
                    },
                    raw: true
                });
                
                if (!dimensao) {
                    console.warn(`No dimension data found for shipment ${shipping_id}`);
                }
                
                // Try to parse calculation details if available
                let calculationDetails = null;
                if (validation.mensagem_erro) {
                    try {
                        calculationDetails = JSON.parse(validation.mensagem_erro);
                    } catch (e) {
                        console.warn(`Failed to parse calculation details for ${shipping_id}: ${e.message}`);
                    }
                }
                
                // Use calculation details if available (for multi-item packs)
                if (Array.isArray(calculationDetails)) {
                    itemDetails = itemIds.map(id => {
                        const detalhe = detalhesVendas.find(d => d.order_item_id === id) || {};
                        const calcDetail = calculationDetails.find(c => c.item_id === id);
                        
                        return {
                            id,
                            quantity: detalhe.quantidade || calcDetail?.quantidade || 1,
                            freight: calcDetail?.frete_unitario || null,
                            subtotal: calcDetail?.subtotal || null,
                            dimensions: dimensao ? {
                                width: dimensao.width,
                                length: dimensao.length,
                                height: dimensao.height,
                                weight: dimensao.weight
                            } : null,
                            calculatedWeight: dimensao && dimensao.weight ? (dimensao.weight / 1000).toFixed(4) : null,
                            volumetricWeight: dimensao && dimensao.width && dimensao.length && dimensao.height 
                                ? ((dimensao.width * dimensao.length * dimensao.height) / 6000).toFixed(4) 
                                : null
                        };
                    });
                } else {
                    // Standard single-item processing
                    itemDetails = itemIds.map(id => {
                        const detalhe = detalhesVendas.find(d => d.order_item_id === id) || {};
                        
                        return {
                            id,
                            quantity: detalhe.quantidade || 1,
                            dimensions: dimensao ? {
                                width: dimensao.width,
                                length: dimensao.length,
                                height: dimensao.height,
                                weight: dimensao.weight
                            } : null,
                            calculatedWeight: dimensao && dimensao.weight ? (dimensao.weight / 1000).toFixed(4) : null,
                            volumetricWeight: dimensao && dimensao.width && dimensao.length && dimensao.height 
                                ? ((dimensao.width * dimensao.length * dimensao.height) / 6000).toFixed(4) 
                                : null
                        };
                    });
                }
            }
            
            // Respond with combined information
            res.json({
                validation,
                itemDetails,
                hasMultipleItems: itemDetails.length > 1
            });
        } catch (error) {
            console.error('Error fetching validation details:', error);
            res.status(500).json({ 
                error: 'Error fetching validation details', 
                details: error.message 
            });
        }
    }
    
    /**
     * Manually validate a shipment
     */
    async manuallyValidate(req, res) {
        try {
            const { shipping_id } = req.params;
            const { status } = req.body;
            
            // Check if validation exists
            const validation = await ValidacaoPacote.findByPk(shipping_id);
            
            if (!validation) {
                return res.status(404).json({ error: 'Validation not found' });
            }
            
            // Update status
            validation.status_validacao = status || 'VALIDADO_MANUAL';
            validation.data_validacao = new Date();
            
            await validation.save();
            
            res.json({
                success: true,
                message: `Validation ${shipping_id} status updated to ${validation.status_validacao}`,
                validation
            });
        } catch (error) {
            console.error('Error manually validating:', error);
            res.status(500).json({ 
                error: 'Error manually validating', 
                details: error.message 
            });
        }
    }
    
    /**
     * Reprocess validation for a shipment
     */
    async reprocessValidation(req, res) {
        try {
            const { shipping_id } = req.params;
            
            // Check if validation exists
            const validation = await ValidacaoPacote.findByPk(shipping_id);
            
            if (!validation) {
                return res.status(404).json({ error: 'Validation not found' });
            }
            
            // Get access token
            const accessToken = await authService.getValidToken();
            
            // Reprocess validation
            await validacaoFreteService.validarFretePorPacote(shipping_id, accessToken);
            
            // Get the updated validation
            const updatedValidation = await ValidacaoPacote.findByPk(shipping_id);
            
            res.json({
                success: true,
                message: `Validation ${shipping_id} reprocessed successfully`,
                validation: updatedValidation
            });
        } catch (error) {
            console.error('Error reprocessing validation:', error);
            res.status(500).json({ 
                error: 'Error reprocessing validation', 
                details: error.message 
            });
        }
    }
}

module.exports = new ValidacaoFreteController();
