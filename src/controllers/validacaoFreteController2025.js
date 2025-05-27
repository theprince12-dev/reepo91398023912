// src/controllers/validacaoFreteController2025.js
const validacaoFreteService2025 = require('../services/validacaoFreteService2025');
const authService = require('../services/authService');
const { Frete2025, ValidacaoPacote2025 } = require('../../models');

// Controlador para as validações de frete do modelo 2025
class ValidacaoFreteController2025 {

    // Valida o frete de um pacote específico usando regras de 2025
    async validarFretePacote(req, res) {
        try {
            const { shipping_id } = req.params;
            // Obtém o token de acesso do body, ou busca um token válido se não fornecido
            let { access_token } = req.body;
            
            if (!shipping_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Parâmetro shipping_id é obrigatório.' 
                });
            }
            
            // Se não tiver access_token, buscar um token válido do AuthService
            if (!access_token) {
                try {
                    access_token = await authService.getValidToken();
                    if (!access_token) {
                        throw new Error('Não foi possível obter um token válido');
                    }
                } catch (tokenError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Erro ao obter token de acesso: ' + tokenError.message
                    });
                }
            }

            const resultado = await validacaoFreteService2025.validarFretePorPacote(shipping_id, access_token);
            
            return res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            console.error('validarFretePacote2025:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message || 'Erro ao validar frete do pacote.' 
            });
        }
    }

    // Busca validações de frete já realizadas
    async buscarValidacoesFrete(req, res) {
        try {
            const { status, limit = 100, offset = 0 } = req.query;
            
            const where = {};
            if (status) {
                where.status_validacao = status;
            }
            
            const validacoes = await ValidacaoPacote2025.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['updatedAt', 'DESC']]
            });
            
            return res.json({
                success: true,
                count: validacoes.count,
                data: validacoes.rows
            });
        } catch (error) {
            console.error('buscarValidacoesFrete2025:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message || 'Erro ao buscar validações de frete.' 
            });
        }
    }

    // Retorna estatísticas das validações
    async estatisticasValidacoes(req, res) {
        try {
            // Buscar contagens por status
            const contagens = await ValidacaoPacote2025.findAll({
                attributes: [
                    'status_validacao', 
                    [ValidacaoPacote2025.sequelize.fn('COUNT', ValidacaoPacote2025.sequelize.col('shipping_id')), 'total']
                ],
                group: ['status_validacao']
            });
            
            // Calcular totais e médias
            const totalRegistros = await ValidacaoPacote2025.count();
            
            const totalDiferencaPositiva = await ValidacaoPacote2025.sum('diferenca', {
                where: {
                    diferenca: {
                        [ValidacaoPacote2025.sequelize.Op.gt]: 0
                    }
                }
            }) || 0;
            
            const totalDiferencaNegativa = await ValidacaoPacote2025.sum('diferenca', {
                where: {
                    diferenca: {
                        [ValidacaoPacote2025.sequelize.Op.lt]: 0
                    }
                }
            }) || 0;
            
            const countDiferencaPositiva = await ValidacaoPacote2025.count({
                where: {
                    diferenca: {
                        [ValidacaoPacote2025.sequelize.Op.gt]: 0
                    }
                }
            });
            
            const countDiferencaNegativa = await ValidacaoPacote2025.count({
                where: {
                    diferenca: {
                        [ValidacaoPacote2025.sequelize.Op.lt]: 0
                    }
                }
            });
            
            // Organizar resultados
            const estatisticas = {
                total_registros: totalRegistros,
                contagem_por_status: contagens,
                diferenca_positiva: {
                    quantidade: countDiferencaPositiva,
                    valor_total: Number(totalDiferencaPositiva).toFixed(2),
                    media: countDiferencaPositiva > 0 ? (totalDiferencaPositiva / countDiferencaPositiva).toFixed(2) : 0
                },
                diferenca_negativa: {
                    quantidade: countDiferencaNegativa,
                    valor_total: Number(totalDiferencaNegativa).toFixed(2),
                    media: countDiferencaNegativa > 0 ? (totalDiferencaNegativa / countDiferencaNegativa).toFixed(2) : 0
                }
            };
            
            return res.json({
                success: true,
                data: estatisticas
            });
        } catch (error) {
            console.error('estatisticasValidacoes2025:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message || 'Erro ao calcular estatísticas.' 
            });
        }
    }

    // Obtém detalhes de uma validação específica
    async obterDetalhesValidacao(req, res) {
        try {
            const { shipping_id } = req.params;
            
            if (!shipping_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro shipping_id é obrigatório.'
                });
            }
            
            const validacao = await ValidacaoPacote2025.findByPk(shipping_id);
            
            if (!validacao) {
                return res.status(404).json({
                    success: false,
                    message: `Nenhuma validação encontrada para o shipping_id ${shipping_id}.`
                });
            }
            
            return res.json({
                success: true,
                data: validacao
            });
            
        } catch (error) {
            console.error('obterDetalhesValidacao2025:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao obter detalhes da validação.'
            });
        }
    }

    // Retorna usuário logado atualmente
    async obterUsuarioAtual(req, res) {
        try {
            const { access_token } = req.body;
            
            if (!access_token) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro access_token é obrigatório.'
                });
            }
            
            const userId = await authService.obterSellerId(access_token);
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Não foi possível obter o ID do usuário com o token fornecido.'
                });
            }
            
            const userDetails = await authService.obterDetalhesUsuarioCompleto(userId, access_token);
            
            if (!userDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Não foi possível obter os detalhes do usuário.'
                });
            }
            
            return res.json({
                success: true,
                data: {
                    user_id: userId,
                    nickname: userDetails.nickname,
                    email: userDetails.email,
                    first_name: userDetails.first_name,
                    last_name: userDetails.last_name,
                    status: userDetails.status,
                    reputation: userDetails.seller_reputation,
                    site_id: userDetails.site_id
                }
            });
            
        } catch (error) {
            console.error('obterUsuarioAtual:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao obter usuário atual.'
            });
        }
    }
}

module.exports = new ValidacaoFreteController2025();
