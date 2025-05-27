// src/services/freteReportService-fixed.js
const { Op, Sequelize } = require('sequelize');
const db = require('../../models');
const ValidacaoPacote = db.ValidacaoPacote;
const Venda = db.Venda;
const DetalhesVenda = db.DetalhesVenda;
const User = db.User;
const csv = require('csv-stringify');
const fs = require('fs');
const path = require('path');
const authService = require('./authService');

/**
 * Serviço para geração de relatórios de divergências de frete
 */
class FreteReportService {
    /**
     * Obtém divergências de frete com base nos filtros fornecidos
     * @param {Object} options - Opções de filtro
     * @param {Date} options.from - Data inicial
     * @param {Date} options.to - Data final
     * @param {String} options.status - Status da validação (pendente, validado, corrigido, ignorado)
     * @param {Number} options.minDifference - Diferença mínima para considerar
     * @param {Boolean} options.onlyLoss - Se true, mostra apenas divergências com prejuízo
     * @returns {Promise<Array>} Lista de divergências
     */
    async getFreightDiscrepancies({ from, to, status, minDifference = 0.1, onlyLoss = true }) {
        try {
            // Construir filtro base
            const whereClause = {
                data_validacao: {
                    [Op.between]: [from, to]
                },
                frete_calculado: {
                    [Op.ne]: null
                }
            };

            // Adicionar filtro de status, se fornecido
            if (status) {
                whereClause.status_validacao = status;
            }

            // Para filtrar por diferença, vamos calcular no Sequelize
            // Primeiro, vamos buscar todos os registros e depois filtrar pela diferença

            // Buscar as divergências
            let discrepancies = await ValidacaoPacote.findAll({
                where: whereClause,
                order: [
                    [Sequelize.literal('(frete_calculado - frete_cobrado_api)'), 'ASC'] // Ordenar do maior prejuízo para o menor
                ],
                include: [
                    {
                        model: Venda,
                        as: 'venda'
                    }
                ]
            });

            // Buscar detalhes de vendas relacionados
            const vendaIds = discrepancies
                .filter(d => d.venda_id)
                .map(d => d.venda_id);
            
            // Buscar detalhes de vendas em uma única consulta para melhor desempenho
            const detalhesVendas = vendaIds.length > 0 ? 
                await DetalhesVenda.findAll({
                    where: {
                        venda_id: {
                            [Op.in]: vendaIds
                        }
                    }
                }) : [];
                
            // Criar um mapa de detalhes por venda_id para facilitar o acesso
            const detalhesMap = {};
            detalhesVendas.forEach(detalhe => {
                if (!detalhesMap[detalhe.venda_id]) {
                    detalhesMap[detalhe.venda_id] = [];
                }
                detalhesMap[detalhe.venda_id].push(detalhe);
            });

            // Processar e formatar os dados para o relatório
            const formattedDiscrepancies = discrepancies.map(d => {
                const venda = d.venda || {};
                
                // Calcular a diferença manualmente
                const frete_calculado = parseFloat(d.frete_calculado || 0);
                const frete_cobrado = parseFloat(d.frete_cobrado_api || 0);
                const diferenca = frete_calculado - frete_cobrado;
                
                // Verificar se atende ao critério de diferença mínima
                if (onlyLoss && diferenca > -parseFloat(minDifference)) {
                    return null; // Pular este item se estamos filtrando por perdas e não é uma perda significativa
                }
                
                if (!onlyLoss && Math.abs(diferenca) < parseFloat(minDifference)) {
                    return null; // Pular se a diferença é menor que o mínimo
                }
                
                let result = {
                    shipping_id: d.shipping_id,
                    sale_id: d.venda_id,
                    charged_freight: frete_cobrado,
                    calculated_freight: frete_calculado,
                    difference: diferenca,
                    is_loss: diferenca < 0,
                    validation_date: d.data_validacao,
                    status: d.status_validacao || 'pendente',
                    shipping_mode: d.shipping_mode || 'standard',
                    column_used: d.coluna_tabela_usada
                };

                // Adicionar informações da venda se disponível
                if (venda.sale_id) {
                    result = {
                        ...result,
                        order_date: venda.date_created,
                        buyer_id: venda.buyer_id,
                        buyer_nickname: venda.buyer_nickname
                    };
                }

                return result;
            });

            // Filtrar valores nulos (que foram pulados devido aos critérios de diferença mínima)
            const filteredDiscrepancies = formattedDiscrepancies.filter(d => d !== null);
            
            return filteredDiscrepancies;
        } catch (error) {
            console.error('Erro ao obter divergências de frete:', error);
            throw new Error(`Falha ao buscar relatório de divergências: ${error.message}`);
        }
    }

    /**
     * Obtém informações detalhadas sobre uma divergência específica
     * @param {String} shippingId - ID do envio
     * @returns {Promise<Object>} Detalhes da divergência
     */
    async getShipmentDiscrepancy(shippingId) {
        try {
            // Buscar divergência específica
            const discrepancy = await ValidacaoPacote.findOne({
                where: { shipping_id: shippingId },
                include: [
                    {
                        model: Venda,
                        as: 'venda'
                    }
                ]
            });
            
            // Buscar detalhes da venda se disponível
            let detalhesVenda = [];
            if (discrepancy && discrepancy.venda_id) {
                detalhesVenda = await DetalhesVenda.findAll({
                    where: { venda_id: discrepancy.venda_id }
                });
            }

            if (!discrepancy) {
                throw new Error(`Divergência para o envio ${shippingId} não encontrada`);
            }

            // Calcular a diferença manualmente
            const frete_calculado = parseFloat(discrepancy.frete_calculado || 0);
            const frete_cobrado = parseFloat(discrepancy.frete_cobrado_api || 0);
            const diferenca = frete_calculado - frete_cobrado;

            // Formatar para a resposta
            const result = {
                shipping_id: discrepancy.shipping_id,
                sale_id: discrepancy.venda_id,
                charged_freight: frete_cobrado,
                calculated_freight: frete_calculado,
                difference: diferenca,
                is_loss: diferenca < 0,
                validation_date: discrepancy.data_validacao,
                status: discrepancy.status_validacao || 'pendente',
                shipping_mode: discrepancy.shipping_mode || 'standard',
                column_used: discrepancy.coluna_tabela_usada
            };

            // Incluir detalhes da venda, se disponível
            if (discrepancy.venda) {
                // Obter informações da venda
                const saleDetails = {
                    date_created: discrepancy.venda.date_created,
                    buyer_id: discrepancy.venda.buyer_id,
                    buyer_nickname: discrepancy.venda.buyer_nickname,
                    shipping_amount: discrepancy.venda.total_amount,
                    items_count: detalhesVenda.length
                };
                
                // Adicionar informações de itens se disponíveis
                if (detalhesVenda.length > 0) {
                    saleDetails.items = detalhesVenda.map(detalhe => ({
                        id: detalhe.order_item_id,
                        title: `Item ${detalhe.order_item_id}`,
                        category_id: detalhe.category_id,
                        height: detalhe.height,
                        width: detalhe.width,
                        length: detalhe.length,
                        weight: detalhe.weight,
                        volume: detalhe.volume
                    }));
                }
                
                result.sale_details = saleDetails;
            }

            return result;
        } catch (error) {
            console.error('Erro ao obter detalhes de divergência:', error);
            throw new Error(`Falha ao buscar detalhes do envio: ${error.message}`);
        }
    }

    /**
     * Gera um relatório resumido de divergências
     * @param {Object} options - Opções de filtro
     * @returns {Promise<Object>} Relatório resumido
     */
    async getSummaryReport(options) {
        try {
            // Obter todas as divergências que atendem aos filtros
            const discrepancies = await this.getFreightDiscrepancies(options);
            
            // Obter número total de vendas no período para comparação
            const vendas = await Venda.count({
                where: {
                    date_created: {
                        [Op.between]: [options.from, options.to]
                    }
                }
            });

            // Calcular resumos agregados
            const totalLoss = discrepancies
                .filter(d => d.is_loss)
                .reduce((sum, d) => sum + Math.abs(d.difference), 0);
            
            // Agrupar por mês
            const monthlyData = {};
            discrepancies.forEach(d => {
                const date = new Date(d.validation_date);
                const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        month: month,
                        count: 0,
                        total_loss: 0,
                        average_loss: 0
                    };
                }
                
                monthlyData[month].count++;
                if (d.is_loss) {
                    monthlyData[month].total_loss += Math.abs(d.difference);
                }
            });
            
            // Calcular médias mensais
            Object.keys(monthlyData).forEach(month => {
                monthlyData[month].average_loss = 
                    monthlyData[month].total_loss / monthlyData[month].count;
            });
            
            // Agrupar por categoria
            const categoryData = {};
            for (const d of discrepancies) {
                if (!d.is_loss) continue;
                
                // Só podemos calcular categoria se tivermos venda e detalhes
                if (!d.sale_id) continue;
                
                // Buscar detalhes da venda
                const detalhes = await DetalhesVenda.findAll({
                    where: { venda_id: d.sale_id },
                    limit: 1 // Precisamos apenas do primeiro para a categoria
                });
                
                if (!detalhes || detalhes.length === 0) continue;
                
                // Usar a categoria do primeiro detalhe
                const categoryId = detalhes[0].category_id;
                
                if (!categoryData[categoryId]) {
                    categoryData[categoryId] = {
                        category_id: categoryId,
                        count: 0,
                        total_loss: 0
                    };
                }
                
                categoryData[categoryId].count++;
                categoryData[categoryId].total_loss += Math.abs(d.difference);
            }
            
            // Agrupar por comprador
            const buyerData = {};
            for (const d of discrepancies) {
                if (!d.is_loss) continue;
                if (!d.buyer_id) continue;
                
                if (!buyerData[d.buyer_id]) {
                    buyerData[d.buyer_id] = {
                        buyer_id: d.buyer_id,
                        buyer_nickname: d.buyer_nickname || d.buyer_id,
                        count: 0,
                        total_loss: 0
                    };
                }
                
                buyerData[d.buyer_id].count++;
                buyerData[d.buyer_id].total_loss += Math.abs(d.difference);
            }
            
            // Agrupar por status
            const statusData = {};
            discrepancies.forEach(d => {
                const status = d.status || 'pendente';
                
                if (!statusData[status]) {
                    statusData[status] = {
                        status: status,
                        count: 0,
                        total_difference: 0
                    };
                }
                
                statusData[status].count++;
                statusData[status].total_difference += d.difference;
            });
            
            // Montar resultado final
            return {
                report_meta: {
                    from_date: options.from,
                    to_date: options.to,
                    total_sales: vendas,
                    total_shipments_analyzed: discrepancies.length,
                    loss_percentage: vendas ? ((discrepancies.length / vendas) * 100).toFixed(2) : 0,
                    total_loss: totalLoss.toFixed(2)
                },
                monthly_summary: Object.values(monthlyData)
                    .sort((a, b) => a.month.localeCompare(b.month)),
                top_categories: Object.values(categoryData)
                    .sort((a, b) => b.total_loss - a.total_loss)
                    .slice(0, 5),
                top_buyers: Object.values(buyerData)
                    .sort((a, b) => b.total_loss - a.total_loss)
                    .slice(0, 5),
                status_summary: Object.values(statusData)
            };
        } catch (error) {
            console.error('Erro ao gerar relatório resumido:', error);
            throw new Error(`Falha ao gerar relatório resumido: ${error.message}`);
        }
    }

    /**
     * Exporta relatório de divergências para CSV
     * @param {Object} options - Opções de filtro
     * @returns {Promise<String>} Caminho para o arquivo CSV gerado
     */
    async exportReport(options) {
        try {
            // Obter as divergências diretamente do serviço sem usar frete_validado
            // Usamos o método getFreightDiscrepancies que já funciona corretamente
            const discrepancies = await this.getFreightDiscrepancies(options);
            
            // Preparar dados para CSV
            const csvData = discrepancies.map(d => ({
                    'ID do Envio': d.shipping_id,
                    'ID da Venda': d.sale_id || '',
                    'Data do Pedido': d.order_date ? new Date(d.order_date).toLocaleDateString('pt-BR') : '',
                    'Comprador': d.buyer_nickname || d.buyer_id || '',
                    'Frete Cobrado (R$)': d.charged_freight.toFixed(2).replace('.', ','),
                    'Frete Calculado (R$)': d.calculated_freight.toFixed(2).replace('.', ','),
                    'Diferença (R$)': d.difference.toFixed(2).replace('.', ','),
                    'Prejuízo?': d.is_loss ? 'Sim' : 'Não',
                    'Status': d.status,
                    'Coluna Usada': d.column_used || '',
                    'Data de Validação': new Date(d.validation_date).toLocaleDateString('pt-BR')
            }));
            
            // Gerar CSV
            const filename = `divergencias-frete_${new Date().toISOString().slice(0,10)}.csv`;
            const filepath = path.join(__dirname, '..', '..', 'public', 'downloads', filename);
            
            // Garantir que o diretório existe
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Criar o CSV
            return new Promise((resolve, reject) => {
                csv.stringify(csvData, { 
                    header: true,
                    delimiter: ';'
                }, (err, output) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    fs.writeFile(filepath, output, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        resolve({
                            filename,
                            filepath: `/downloads/${filename}`,
                            fullPath: filepath
                        });
                    });
                });
            });
        } catch (error) {
            console.error(`   [ERRO] Falha ao exportar relatório: ${error.message}`);
            throw new Error(`Falha ao exportar relatório: ${error.message}`);
        }
    }
}

module.exports = new FreteReportService();
