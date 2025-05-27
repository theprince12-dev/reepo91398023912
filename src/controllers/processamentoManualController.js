/**
 * Controlador para o processamento manual de vendas
 * Este módulo implementa endpoints para permitir a execução passo a passo
 * das operações que eram anteriormente executadas automaticamente.
 */

const vendaService = require('../services/vendaService');
const itemService = require('../services/itemService');
const validacaoFreteService = require('../services/validacaoFreteService');
const freteService = require('../services/freteService');

// Armazenamento temporário para estados de processamento
// Em produção, isso deveria ser persistido em banco de dados
const processamentoEstados = new Map();

class ProcessamentoManualController {
    /**
     * Verifica se uma venda existe e está disponível para processamento
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Status da verificação
     */
    static async verificarVenda(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar se a venda existe no Mercado Livre
            const venda = await vendaService.getOrderById(orderId);
            
            if (!venda) {
                return res.status(404).json({ success: false, message: 'Venda não encontrada no Mercado Livre' });
            }
            
            // Se a venda existe, inicializar o estado de processamento, caso ainda não exista
            if (!processamentoEstados.has(orderId)) {
                processamentoEstados.set(orderId, {
                    step1_completed: false,
                    step2_completed: false,
                    step3_completed: false, 
                    step4_completed: false,
                    step5_completed: false,
                    data: null,
                    items: null,
                    shipping_data: null,
                    validation_result: null,
                    result: null
                });
            }
            
            return res.json({ 
                success: true, 
                message: 'Venda encontrada e disponível para processamento',
                order_id: orderId
            });
        } catch (error) {
            console.error('Erro ao verificar venda:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao verificar venda',
                error: error.message
            });
        }
    }

    /**
     * Obtem os dados básicos da venda (Etapa 1)
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Dados da venda e estado atual do processamento
     */
    static async obterDadosVenda(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar se já temos um estado para esta venda
            let state = processamentoEstados.get(orderId);
            
            if (!state) {
                state = {
                    step1_completed: false,
                    step2_completed: false,
                    step3_completed: false,
                    step4_completed: false,
                    step5_completed: false,
                    data: null,
                    items: null,
                    shipping_data: null,
                    validation_result: null,
                    result: null
                };
                processamentoEstados.set(orderId, state);
            }
            
            // Buscar dados da venda, mesmo que já tenha obtido antes (para atualizar)
            const venda = await vendaService.getOrderById(orderId);
            
            if (!venda) {
                return res.status(404).json({ success: false, message: 'Venda não encontrada' });
            }
            
            // Atualizar o estado
            state.data = venda;
            state.step1_completed = true;
            processamentoEstados.set(orderId, state);
            
            return res.json({
                success: true,
                message: 'Dados da venda obtidos com sucesso',
                data: venda,
                processing_state: {
                    ...state,
                    step1_result: venda,
                }
            });
        } catch (error) {
            console.error('Erro ao obter dados da venda:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao obter dados da venda',
                error: error.message
            });
        }
    }

    /**
     * Obtém os itens da venda (Etapa 2)
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Itens da venda
     */
    static async obterItensVenda(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar se já temos um estado para esta venda e se já concluiu a etapa 1
            let state = processamentoEstados.get(orderId);
            
            if (!state) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Estado da venda não inicializado. Execute a etapa 1 primeiro.' 
                });
            }
            
            if (!state.step1_completed) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Etapa 1 ainda não concluída. Execute-a primeiro.' 
                });
            }
            
            // Buscar itens da venda
            let items;
            if (state.data && state.data.order_items) {
                // Se a venda já tem os itens incluídos nos dados
                items = state.data.order_items;
            } else {
                // Caso contrário, buscar os itens separadamente
                items = await itemService.getItemsByOrderId(orderId);
            }
            
            if (!items || items.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Nenhum item encontrado para esta venda' 
                });
            }
            
            // Atualizar o estado
            state.items = items;
            state.step2_completed = true;
            processamentoEstados.set(orderId, state);
            
            return res.json({
                success: true,
                message: 'Itens da venda obtidos com sucesso',
                items: items,
                processing_state: {
                    ...state,
                    step2_result: items,
                }
            });
        } catch (error) {
            console.error('Erro ao obter itens da venda:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao obter itens da venda',
                error: error.message
            });
        }
    }

    /**
     * Processa os dados de envio (Etapa 3)
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Resultado do processamento de envio
     */
    static async processarDadosEnvio(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar estado
            let state = processamentoEstados.get(orderId);
            
            if (!state || !state.step2_completed) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Etapas anteriores não concluídas' 
                });
            }
            
            // Extrair ID do envio dos dados da venda
            if (!state.data || !state.data.shipping || !state.data.shipping.id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Dados de envio não encontrados na venda' 
                });
            }
            
            const shippingId = state.data.shipping.id;
            
            // Buscar dados detalhados do envio
            const shippingData = await freteService.getShippingDetails(shippingId);
            
            if (!shippingData) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dados de envio não encontrados' 
                });
            }
            
            // Atualizar o estado
            state.shipping_data = shippingData;
            state.step3_completed = true;
            processamentoEstados.set(orderId, state);
            
            return res.json({
                success: true,
                message: 'Dados de envio processados com sucesso',
                shipping_data: shippingData,
                processing_state: {
                    ...state,
                    step3_result: shippingData,
                }
            });
        } catch (error) {
            console.error('Erro ao processar dados de envio:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao processar dados de envio',
                error: error.message
            });
        }
    }

    /**
     * Valida o frete da venda (Etapa 4)
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Resultado da validação de frete
     */
    static async validarFrete(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar estado
            let state = processamentoEstados.get(orderId);
            
            if (!state || !state.step3_completed) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Etapas anteriores não concluídas' 
                });
            }
            
            // Extrair dados necessários para validação
            const venda = state.data;
            const shippingData = state.shipping_data;
            
            if (!shippingData) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Dados de envio não disponíveis' 
                });
            }
            
            // Validar o frete
            const validationResult = await validacaoFreteService.validarFrete(shippingData, venda);
            
            // Atualizar o estado
            state.validation_result = validationResult;
            state.step4_completed = true;
            processamentoEstados.set(orderId, state);
            
            return res.json({
                success: true,
                message: 'Frete validado com sucesso',
                validation_result: validationResult,
                processing_state: {
                    ...state,
                    step4_result: validationResult,
                }
            });
        } catch (error) {
            console.error('Erro ao validar frete:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao validar frete',
                error: error.message
            });
        }
    }

    /**
     * Finaliza o processamento e salva os dados (Etapa 5)
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Resultado da finalização
     */
    static async finalizarProcessamento(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Verificar estado
            let state = processamentoEstados.get(orderId);
            
            if (!state || !state.step4_completed) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Etapas anteriores não concluídas' 
                });
            }
            
            // Salvar todos os dados processados no banco de dados
            // Aqui deveriam estar as operações de persistência dos dados processados
            const result = {
                order_id: orderId,
                processed_at: new Date().toISOString(),
                order_data: state.data,
                items: state.items,
                shipping_data: state.shipping_data,
                validation_result: state.validation_result,
                status: 'completed'
            };
            
            // Atualizar o estado
            state.result = result;
            state.step5_completed = true;
            processamentoEstados.set(orderId, state);
            
            return res.json({
                success: true,
                message: 'Processamento finalizado com sucesso',
                result: result,
                processing_state: {
                    ...state,
                    step5_result: result,
                }
            });
        } catch (error) {
            console.error('Erro ao finalizar processamento:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao finalizar processamento',
                error: error.message
            });
        }
    }

    /**
     * Executa todos os passos do processamento de uma vez
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Resultados de todos os passos
     */
    static async executarTodosPassos(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Inicializar ou reiniciar o estado
            let state = {
                step1_completed: false,
                step2_completed: false,
                step3_completed: false, 
                step4_completed: false,
                step5_completed: false,
                data: null,
                items: null,
                shipping_data: null,
                validation_result: null,
                result: null
            };
            processamentoEstados.set(orderId, state);
            
            // PASSO 1: Obter dados da venda
            try {
                const venda = await vendaService.getOrderById(orderId);
                
                if (!venda) {
                    return res.status(404).json({ success: false, message: 'Venda não encontrada' });
                }
                
                state.data = venda;
                state.step1_completed = true;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro no Passo 1: Obter dados da venda',
                    error: error.message,
                    processing_state: state
                });
            }
            
            // PASSO 2: Obter itens da venda
            try {
                let items;
                if (state.data && state.data.order_items) {
                    items = state.data.order_items;
                } else {
                    items = await itemService.getItemsByOrderId(orderId);
                }
                
                if (!items || items.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Nenhum item encontrado para esta venda',
                        processing_state: state
                    });
                }
                
                state.items = items;
                state.step2_completed = true;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro no Passo 2: Obter itens da venda',
                    error: error.message,
                    processing_state: state
                });
            }
            
            // PASSO 3: Processar dados de envio
            try {
                if (!state.data || !state.data.shipping || !state.data.shipping.id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Dados de envio não encontrados na venda',
                        processing_state: state
                    });
                }
                
                const shippingId = state.data.shipping.id;
                const shippingData = await freteService.getShippingDetails(shippingId);
                
                if (!shippingData) {
                    return res.status(404).json({
                        success: false,
                        message: 'Dados de envio não encontrados',
                        processing_state: state
                    });
                }
                
                state.shipping_data = shippingData;
                state.step3_completed = true;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro no Passo 3: Processar dados de envio',
                    error: error.message,
                    processing_state: state
                });
            }
            
            // PASSO 4: Validar frete
            try {
                const venda = state.data;
                const shippingData = state.shipping_data;
                
                const validationResult = await validacaoFreteService.validarFrete(shippingData, venda);
                
                state.validation_result = validationResult;
                state.step4_completed = true;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro no Passo 4: Validar frete',
                    error: error.message,
                    processing_state: state
                });
            }
            
            // PASSO 5: Finalizar processamento
            try {
                const result = {
                    order_id: orderId,
                    processed_at: new Date().toISOString(),
                    order_data: state.data,
                    items: state.items,
                    shipping_data: state.shipping_data,
                    validation_result: state.validation_result,
                    status: 'completed'
                };
                
                state.result = result;
                state.step5_completed = true;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro no Passo 5: Finalizar processamento',
                    error: error.message,
                    processing_state: state
                });
            }
            
            // Atualizar o estado final
            processamentoEstados.set(orderId, state);
            
            // Retornar sucesso com todos os resultados
            return res.json({
                success: true,
                message: 'Todos os passos executados com sucesso',
                order_id: orderId,
                step1_result: state.data,
                step2_result: state.items,
                step3_result: state.shipping_data,
                step4_result: state.validation_result,
                step5_result: state.result,
                processing_state: state
            });
        } catch (error) {
            console.error('Erro ao executar todos os passos:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao executar todos os passos',
                error: error.message
            });
        }
    }

    /**
     * Limpa os dados de processamento de uma venda
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     * @returns {Object} - Confirmação da limpeza
     */
    static async limparDadosProcessamento(req, res) {
        try {
            const orderId = req.params.orderId;
            
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'ID da venda não fornecido' });
            }
            
            // Remover os dados de processamento
            processamentoEstados.delete(orderId);
            
            return res.json({
                success: true,
                message: 'Dados de processamento limpos com sucesso',
                order_id: orderId
            });
        } catch (error) {
            console.error('Erro ao limpar dados de processamento:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao limpar dados de processamento',
                error: error.message
            });
        }
    }
}

module.exports = ProcessamentoManualController;
