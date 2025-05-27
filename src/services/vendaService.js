// src/services/vendaService.js
const authService = require('./authService');
const config = require('../config/mercadolivre'); // Verifique se está sendo usado ou se pode remover
const fetch = require('node-fetch').default; // Verifique se está sendo usado ou se pode remover
const { Venda, DetalhesVenda } = require('../../models');
const detalhesVendaService = require('./detalhesVendaService');
const validacaoFreteService = require('./validacaoFreteService'); // Importa o serviço de validação

class VendaService {

    // Apenas busca as vendas da API do Mercado Livre
    async getAllSales(fromDate, toDate) {
        console.log('getAllSales: Iniciando busca de vendas', { fromDate, toDate });
        let accessToken;
        let sellerId;
        const allSales = [];

        try {
            accessToken = await authService.getValidToken();
            sellerId = await authService.obterSellerId(accessToken);
            if (!sellerId) {
                throw new Error("Não foi possível obter o ID do vendedor.");
            }

            let offset = 0;
            const limit = 50;
            let hasMore = true;

            console.log(`getAllSales: Iniciando busca paginada de vendas para Seller ${sellerId}`);

            while (hasMore) {
                console.log(`getAllSales: Buscando lote de vendas - offset: ${offset}`);
                const salesBatchResponse = await this.fetchSalesBatchAPI(sellerId, accessToken, fromDate, toDate, offset, limit);

                if (!salesBatchResponse || !salesBatchResponse.results || salesBatchResponse.results.length === 0) {
                    console.log(`getAllSales: Fim da busca paginada ou lote vazio - offset: ${offset}`);
                    hasMore = false;
                    break;
                }

                const salesBatch = salesBatchResponse.results;
                console.log(`getAllSales: Lote com ${salesBatch.length} vendas encontrado.`);
                allSales.push(...salesBatch);

                offset += limit;

                if (salesBatch.length < limit || (salesBatchResponse.paging && offset >= salesBatchResponse.paging.total)) {
                    console.log(`getAllSales: Último lote processado - offset: ${offset}`);
                    hasMore = false;
                }
                await new Promise(resolve => setTimeout(resolve, 200)); // Evitar rate limiting
            }

            console.log(`getAllSales: Busca de vendas concluída. Total de vendas encontradas: ${allSales.length}`);
            return {
                success: true,
                message: `Busca de vendas de ${fromDate} a ${toDate} concluída.`,
                sales: allSales,
                total: allSales.length
            };

        } catch (error) {
            console.error('getAllSales: Erro GERAL no processo:', error);
            if (error.name === 'TokenError') {
                throw error;
            }
            throw new Error(`Erro geral ao buscar vendas: ${error.message}`);
        } finally {
            console.log('getAllSales: Método finalizado.');
        }
    }

    // Processa e salva os detalhes de uma única venda
    async processSaleDetails(saleId, accessToken) {
        console.log(`processSaleDetails: Iniciando processamento para venda ${saleId}`);
        try {
            if (!accessToken) { // Garante que o token seja passado ou obtido
                accessToken = await authService.getValidToken();
            }
            const detalhes = await detalhesVendaService.obterDetalhesVenda(saleId, accessToken);
            if (detalhes && detalhes.length > 0) {
                await detalhesVendaService.salvarDetalhesVenda(detalhes);
                console.log(`processSaleDetails: Detalhes da venda ${saleId} salvos com sucesso.`);
                const shippingIds = detalhes.map(d => d.shipping_id).filter(Boolean);
                return { 
                    success: true, 
                    message: `Detalhes da venda ${saleId} processados e salvos.`,
                    shipping_ids: [...new Set(shippingIds)] // Retorna IDs de envio únicos
                };
            } else {
                console.log(`processSaleDetails: Nenhum detalhe encontrado para a venda ${saleId}.`);
                return { success: true, message: `Nenhum detalhe encontrado para a venda ${saleId}.`, shipping_ids: [] };
            }
        } catch (error) {
            console.error(`processSaleDetails: Erro ao processar/salvar detalhes da venda ${saleId}:`, error.message);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Erro ao processar detalhes da venda ${saleId}: ${error.message}`);
        } finally {
            console.log(`processSaleDetails: Método finalizado para venda ${saleId}.`);
        }
    }

    // Valida o frete para um único shipping_id
    async validateSaleShipping(shippingId, accessToken) {
        console.log(`validateSaleShipping: Iniciando validação de frete para shipping_id ${shippingId}`);
        try {
            if (!accessToken) { // Garante que o token seja passado ou obtido
                accessToken = await authService.getValidToken();
            }
            // A função validarFretePorPacote já lida com o salvamento do resultado
            await validacaoFreteService.validarFretePorPacote(shippingId, accessToken);
            console.log(`validateSaleShipping: Validação de frete para ${shippingId} concluída e resultado salvo.`);
            // Você pode querer buscar o resultado da validação aqui se precisar retorná-lo
            // Por ora, apenas confirmamos a execução.
            return { success: true, message: `Validação de frete para ${shippingId} disparada e resultado salvo.` };
        } catch (error) {
            console.error(`validateSaleShipping: Erro ao validar frete para ${shippingId}:`, error.message);
            if (error.name === 'TokenError') throw error;
            // O erro já deve ter sido logado e salvo em ValidacaoPacote pelo validarFretePorPacote
            throw new Error(`Erro ao validar frete para ${shippingId}: ${error.message}`);
        } finally {
            console.log(`validateSaleShipping: Método finalizado para shipping_id ${shippingId}.`);
        }
    }
    
    // Função REAL para buscar vendas da API Mercado Livre (permanece igual)
    async fetchSalesBatchAPI(sellerId, accessToken, fromDateISO, toDateISO, offset, limit) {
        const dateFrom = fromDateISO;
        const dateTo = toDateISO;

        const searchParams = new URLSearchParams({
            seller: sellerId,
            'order.date_created.from': dateFrom,
            'order.date_created.to': dateTo,
            limit: limit,
            offset: offset,
            sort: 'date_desc'
        });

        const url = `${config.api_base_url}/orders/search?${searchParams.toString()}`;
        console.log(`fetchSalesBatchAPI: Buscando em ${url}`);

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`fetchSalesBatchAPI: Erro ${response.status} ao buscar vendas: ${errorBody}`);
                if (response.status === 401) {
                    throw { name: 'TokenError', message: 'Token inválido ou expirado ao buscar lote de vendas.' };
                }
                let errorMessage = `API retornou erro ${response.status} ao buscar vendas.`;
                try {
                    const parsedError = JSON.parse(errorBody);
                    if (parsedError && parsedError.message) {
                        errorMessage += ` Mensagem: ${parsedError.message}`;
                    }
                } catch (e) { /* Ignora se não for JSON */ }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`fetchSalesBatchAPI: Falha na chamada API: ${error.message}`);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao buscar lote de vendas da API: ${error.message}`);
        }
    }
}

module.exports = new VendaService();
