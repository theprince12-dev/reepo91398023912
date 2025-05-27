// src/controllers/freteReportController.js
const freteReportService = require('../services/freteReportService');

/**
 * Controller para relatórios de divergências de frete
 */
class FreteReportController {
    /**
     * Obtém uma lista de divergências de frete
     * @param {Object} req - Objeto de requisição Express
     * @param {Object} res - Objeto de resposta Express
     */
    async getFreightDiscrepancies(req, res) {
        try {
            // Extrair parâmetros da requisição
            const { from, to, status, min_difference, only_loss } = req.query;

            // Validar parâmetros obrigatórios
            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros de data (from e to) são obrigatórios.'
                });
            }

            // Converter only_loss para booleano
            const onlyLoss = only_loss === 'true' || only_loss === true;

            // Preparar opções para o serviço
            const options = {
                from: new Date(from),
                to: new Date(to),
                status: status || null,
                minDifference: parseFloat(min_difference || 0.1),
                onlyLoss
            };

            // Obter as divergências
            const discrepancies = await freteReportService.getFreightDiscrepancies(options);

            // Retornar resultado
            res.json({
                success: true,
                discrepancies,
                total: discrepancies.length,
                filters: options
            });
        } catch (error) {
            console.error('Error in getFreightDiscrepancies:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtém detalhes de uma divergência específica
     * @param {Object} req - Objeto de requisição Express
     * @param {Object} res - Objeto de resposta Express
     */
    async getShipmentDiscrepancy(req, res) {
        try {
            // Extrair ID do envio
            const { shipping_id } = req.params;

            // Validar parâmetro
            if (!shipping_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do envio é obrigatório.'
                });
            }

            // Obter os detalhes da divergência
            const data = await freteReportService.getShipmentDiscrepancy(shipping_id);

            // Retornar resultado
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getShipmentDiscrepancy:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtém um relatório resumido de divergências
     * @param {Object} req - Objeto de requisição Express
     * @param {Object} res - Objeto de resposta Express
     */
    async getSummaryReport(req, res) {
        try {
            // Extrair parâmetros da requisição
            const { from, to, min_difference } = req.query;

            // Validar parâmetros obrigatórios
            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros de data (from e to) são obrigatórios.'
                });
            }

            // Preparar opções para o serviço
            const options = {
                from: new Date(from),
                to: new Date(to),
                minDifference: parseFloat(min_difference || 0.1)
            };

            // Obter o relatório resumido
            const summaryReport = await freteReportService.getSummaryReport(options);

            // Retornar resultado
            res.json({
                success: true,
                ...summaryReport
            });
        } catch (error) {
            console.error('Error in getSummaryReport:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Exporta um relatório de divergências para CSV
     * @param {Object} req - Objeto de requisição Express
     * @param {Object} res - Objeto de resposta Express
     */
    async exportReport(req, res) {
        try {
            // Extrair parâmetros da requisição
            const { from, to, status, min_difference, only_loss, format } = req.query;

            // Validar parâmetros obrigatórios
            if (!from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros de data (from e to) são obrigatórios.'
                });
            }

            // Verificar formato solicitado
            const exportFormat = format || 'csv';
            if (exportFormat !== 'csv') {
                return res.status(400).json({
                    success: false,
                    message: 'Formato não suportado. Utilize "csv".'
                });
            }

            // Converter only_loss para booleano
            const onlyLoss = only_loss === 'true' || only_loss === true;

            // Preparar opções para o serviço
            const options = {
                from: new Date(from),
                to: new Date(to),
                status: status || null,
                minDifference: parseFloat(min_difference || 0.1),
                onlyLoss
            };

            // Exportar o relatório
            const reportFile = await freteReportService.exportReport(options);

            // Se for requisição direta de download, redirecionar
            if (req.query.download === 'true') {
                return res.redirect(reportFile.filepath);
            }

            // Caso contrário, retornar informações sobre o arquivo
            res.json({
                success: true,
                file: reportFile
            });
        } catch (error) {
            console.error('Error in exportReport:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new FreteReportController();
