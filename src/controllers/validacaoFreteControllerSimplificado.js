// src/controllers/validacaoFreteControllerSimplificado.js
/**
 * Controlador simplificado para validação de frete
 * Usa a nova implementação que obtém dimensões diretamente da API
 */
const validacaoFreteService = require('../services/validacaoFreteService-simplificado');
const authService = require('../services/authService');

class ValidacaoFreteControllerSimplificado {
    /**
     * Valida o frete de um pacote específico
     */
    async validarPacote(req, res) {
        try {
            const { shipping_id } = req.params;
            
            if (!shipping_id) {
                return res.status(400).json({ 
                    error: 'ID do pacote (shipping_id) é obrigatório' 
                });
            }
            
            // Obter token de acesso válido
            const accessToken = await authService.getValidToken();
            
            // Validar frete usando o serviço simplificado
            const result = await validacaoFreteService.validarFretePorPacote(shipping_id, accessToken);
            
            return res.json({
                success: true,
                shipping_id: shipping_id,
                status: result.status,
                frete_calculado: result.frete_calculado,
                frete_cobrado: result.frete_cobrado,
                diferenca: result.diferenca,
                coluna_frete: result.coluna_frete
            });
            
        } catch (error) {
            console.error(`Erro ao validar frete do pacote ${req.params.shipping_id}:`, error);
            return res.status(500).json({ 
                error: `Erro ao validar frete do pacote ${req.params.shipping_id}`, 
                details: error.message 
            });
        }
    }
    
    /**
     * Lista itens de um pacote com suas dimensões
     * Endpoint útil para diagnóstico
     */
    async listarItensPacote(req, res) {
        try {
            const { shipping_id } = req.params;
            
            if (!shipping_id) {
                return res.status(400).json({ 
                    error: 'ID do pacote (shipping_id) é obrigatório' 
                });
            }
            
            // Obter token de acesso válido
            const accessToken = await authService.getValidToken();
            
            // Obter itens do pacote diretamente da API
            const itens = await validacaoFreteService.obterItensPorShipmentApi(shipping_id, accessToken);
            
            if (!itens || itens.length === 0) {
                return res.status(404).json({
                    error: 'Nenhum item encontrado para este pacote'
                });
            }
            
            // Formatar os itens para visualização
            const itensFormatados = itens.map(item => ({
                id: item.id,
                quantidade: item.quantity,
                preco: item.price,
                condicao: item.condition,
                categoria_id: item.category_id,
                dimensoes: {
                    comprimento: item.dimensions?.length || null,
                    largura: item.dimensions?.width || null,
                    altura: item.dimensions?.height || null,
                    peso: item.dimensions?.weight || null,
                    volume: item.dimensions?.length && item.dimensions?.width && item.dimensions?.height ? 
                        (item.dimensions.length * item.dimensions.width * item.dimensions.height) : null,
                    peso_volumetrico_kg: item.dimensions?.length && item.dimensions?.width && item.dimensions?.height ?
                        ((item.dimensions.length * item.dimensions.width * item.dimensions.height) / 6000).toFixed(4) : null
                }
            }));
            
            return res.json({
                shipping_id: shipping_id,
                quantidade_itens: itens.length,
                itens: itensFormatados
            });
            
        } catch (error) {
            console.error(`Erro ao listar itens do pacote ${req.params.shipping_id}:`, error);
            return res.status(500).json({ 
                error: `Erro ao listar itens do pacote ${req.params.shipping_id}`, 
                details: error.message 
            });
        }
    }
    
    /**
     * Validar múltiplos pacotes em lote
     */
    async validarLote(req, res) {
        try {
            const { shipping_ids } = req.body;
            
            if (!shipping_ids || !Array.isArray(shipping_ids) || shipping_ids.length === 0) {
                return res.status(400).json({ 
                    error: 'Lista de IDs de pacotes é obrigatória'
                });
            }
            
            // Obter token de acesso válido
            const accessToken = await authService.getValidToken();
            
            // Validar cada pacote
            const resultados = [];
            const erros = [];
            
            for (const shipping_id of shipping_ids) {
                try {
                    const result = await validacaoFreteService.validarFretePorPacote(shipping_id, accessToken);
                    resultados.push({
                        shipping_id: shipping_id,
                        status: result.status,
                        frete_calculado: result.frete_calculado,
                        frete_cobrado: result.frete_cobrado,
                        diferenca: result.diferenca
                    });
                } catch (error) {
                    console.error(`Erro validando frete do pacote ${shipping_id}:`, error);
                    erros.push({ 
                        shipping_id: shipping_id, 
                        erro: error.message 
                    });
                }
            }
            
            return res.json({
                total: shipping_ids.length,
                sucessos: resultados.length,
                erros: erros.length,
                resultados: resultados,
                erros: erros
            });
            
        } catch (error) {
            console.error('Erro ao validar lote de pacotes:', error);
            return res.status(500).json({ 
                error: 'Erro ao validar lote de pacotes', 
                details: error.message 
            });
        }
    }
}

module.exports = new ValidacaoFreteControllerSimplificado();
