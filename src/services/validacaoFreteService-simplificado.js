// src/services/validacaoFreteService-simplificado.js
const FreteService = require('./freteService');
const { DetalhesVenda, ValidacaoPacote } = require('../../models');
const specialCategoryService = require('./specialCategoryService');
const userService = require('./userService');
const authService = require('./authService');
const itemService = require('./itemService');
const custoEnvioService = require('./custoEnvioService');
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');

// Função auxiliar para calcular peso volumétrico
function calcularPesoVolumetricoKg(comprimento, largura, altura) {
    if (!comprimento || !largura || !altura) return null;
    try {
        // Fórmula: (comprimento * largura * altura) / 6000 [para dimensões em cm]
        return Number(((Number(comprimento) * Number(largura) * Number(altura)) / 6000).toFixed(4));
    } catch (error) {
        console.error('Erro ao calcular peso volumétrico:', error);
        return null;
    }
}

class ValidacaoFreteService {
    /**
     * Método simplificado que obtém itens diretamente da API do Mercado Livre
     * Utiliza as dimensões fornecidas na própria resposta
     */
    async obterItensPorShipmentApi(shipmentId, accessToken) {
        console.log(`obterItensPorShipmentApi: Obtendo itens da API para shipment ${shipmentId}`);
        
        if (!shipmentId || !accessToken) {
            console.error(`obterItensPorShipmentApi: Parâmetros inválidos - shipmentId: ${shipmentId}`);
            return null;
        }
        
        const url = `${config.api_base_url}/shipments/${shipmentId}/items`;
        
        try {
            const response = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${accessToken}` } 
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`obterItensPorShipmentApi: Erro ${response.status} ao buscar itens de shipment ${shipmentId}: ${errorBody}`);
                if (response.status === 401) {
                    throw { name: 'TokenError', message: `Token inválido/expirado ao buscar itens de shipment ${shipmentId}.` };
                }
                return null;
            }
            
            const itemsData = await response.json();
            
            if (!Array.isArray(itemsData) || itemsData.length === 0) {
                console.warn(`obterItensPorShipmentApi: Nenhum item encontrado para shipment ${shipmentId}`);
                return [];
            }
            
            console.log(`obterItensPorShipmentApi: Encontrado ${itemsData.length} itens para shipment ${shipmentId}`);
            
            // Processar cada item para enriquecê-lo com informações adicionais necessárias
            const items = await Promise.all(itemsData.map(async (item) => {
                // Obter informações de categoria e preço diretamente do item
                const item_id = item.item_id;
                const quantity = item.quantity || 1;
                
                // Usar as dimensões fornecidas diretamente na resposta
                const dimensions = item.dimensions || {};
                
                // Obter detalhes adicionais necessários para o cálculo (preço, condição, categoria)
                const itemDetail = await itemService.getItemById(item_id, accessToken);
                
                // Criar objeto com todas as informações necessárias
                return {
                    id: item_id,
                    quantity: quantity,
                    price: itemDetail?.price || 0,
                    condition: itemDetail?.condition || 'used',
                    category_id: itemDetail?.category_id,
                    dimensions: dimensions
                };
            }));
            
            console.log(`obterItensPorShipmentApi: Processados ${items.length} itens com sucesso`);
            return items;
            
        } catch (error) {
            console.error(`obterItensPorShipmentApi: Erro na chamada API para shipment ${shipmentId}:`, error);
            if (error.name === 'TokenError') throw error;
            return null;
        }
    }
    
    /**
     * Calcula o frete para um item individual utilizando diretamente as dimensões do item
     */
    async calcularFreteIndividual(item, colunaFreteInicial, is_sulsudeste, is_fulfillment, sellerReputationLevelId) {
        console.log(`calcularFreteIndividual: Calculando frete para item ${item.id}`);
        
        try {
            // Extrair dimensões diretamente do item
            const dimensions = item.dimensions || {};
            
            if (!dimensions.width || !dimensions.length || !dimensions.height || !dimensions.weight) {
                console.warn(`calcularFreteIndividual: Dimensões incompletas para o item ${item.id}`);
                return null;
            }
            
            // Calcular pesos
            const peso_g = dimensions.weight || 0;
            const peso_kg = peso_g > 0 ? Number((peso_g / 1000).toFixed(4)) : 0;
            
            const comprimento = dimensions.length || 0;
            const largura = dimensions.width || 0; 
            const altura = dimensions.height || 0;
            const pesoVolumetrico = calcularPesoVolumetricoKg(comprimento, largura, altura);
            
            console.log(`calcularFreteIndividual: Dimensões do item ${item.id}: ${comprimento}cm x ${largura}cm x ${altura}cm, peso ${peso_g}g`);
            console.log(`calcularFreteIndividual: Peso volumétrico calculado: ${pesoVolumetrico}kg`);
            
            // Usar o maior entre peso real e volumétrico
            const pesoCobravel = Math.max(peso_kg, pesoVolumetrico || 0);
            
            if (pesoCobravel <= 0) {
                console.warn(`calcularFreteIndividual: Peso cobrável inválido para item ${item.id}`);
                return null;
            }
            
            // Verificar categoria especial para este item específico
            let is_special_category = 0;
            if (item.category_id) {
                is_special_category = await specialCategoryService.isSpecialCategory(item.category_id);
                console.log(`calcularFreteIndividual: Item ${item.id} - Categoria ${item.category_id} é especial: ${is_special_category}`);
            }
            
            // Garantir que o preço é um número e verificar se é item novo >= 79
            const itemPrice = Number(item.price) || 0;
            const is_item_novo_79 = (item.condition === 'new' && itemPrice >= 79);
            console.log(`calcularFreteIndividual: Item ${item.id} - Preço: R$${itemPrice}, Condição: ${item.condition}`);
            console.log(`calcularFreteIndividual: Item ${item.id} - É novo>=79: ${is_item_novo_79}`);
            
            // Determinar a coluna de frete específica para este item
            const dadosItemParaColuna = {
                is_sulsudeste: is_sulsudeste, 
                is_special_category: is_special_category,
                is_fulfillment: is_fulfillment,
                total_amount: itemPrice
            };
            
            const itemProxyParaColuna = {
                condition: item.condition || 'used',
                price: itemPrice,
                category_id: item.category_id
            };
            
            // Obter coluna de frete específica para este item
            const colunaFreteItem = await FreteService.selecionarColunaFrete(
                dadosItemParaColuna, 
                itemProxyParaColuna, 
                sellerReputationLevelId
            );
            
            console.log(`calcularFreteIndividual: Item ${item.id} - Coluna inicial: ${colunaFreteInicial}, Coluna específica do item: ${colunaFreteItem}`);
            
            // Usar a coluna específica do item para cálculo (se disponível)
            const colunaUsada = colunaFreteItem || colunaFreteInicial;
            
            // Obter faixa de peso e valor do frete
            const faixaPeso = await FreteService.obterFaixaPeso(peso_kg, pesoVolumetrico);
            const valorFrete = await FreteService.obterValorFrete(faixaPeso, colunaUsada);
            
            console.log(`calcularFreteIndividual: Item ${item.id}, Peso: ${pesoCobravel}kg, Faixa: ${faixaPeso}, Coluna usada: ${colunaUsada}, Valor: ${valorFrete}`);
            return valorFrete;
        } catch (error) {
            console.error(`calcularFreteIndividual: Erro ao calcular frete individual:`, error);
            return null;
        }
    }
    
    /**
     * Método simplificado para calcular o frete total de um pacote
     */
    async calcularFreteTotalPacote(itens, colunaFrete, is_sulsudeste, is_fulfillment, sellerReputationLevelId) {
        console.log(`calcularFreteTotalPacote: Iniciando cálculo para ${itens.length} itens`);
        
        if (!itens || itens.length === 0) {
            console.warn(`calcularFreteTotalPacote: Nenhum item para calcular frete`);
            return null;
        }
        
        let freteTotal = 0;
        const detalhesCalculo = [];
        
        // Calcular o frete para cada item e somar
        for (const item of itens) {
            const freteItem = await this.calcularFreteIndividual(
                item,
                colunaFrete,
                is_sulsudeste,
                is_fulfillment,
                sellerReputationLevelId
            );
            
            if (freteItem !== null) {
                // Multiplicar pela quantidade do item
                const quantidade = item.quantity || 1;
                const freteItemTotal = freteItem * quantidade;
                freteTotal += freteItemTotal;
                
                detalhesCalculo.push({
                    item_id: item.id,
                    frete_unitario: freteItem,
                    quantidade: quantidade,
                    subtotal: freteItemTotal
                });
                
                console.log(`calcularFreteTotalPacote: Item ${item.id} - Frete unitário: R$${freteItem}, Qtd: ${quantidade}, Subtotal: R$${freteItemTotal}`);
            }
        }
        
        console.log(`calcularFreteTotalPacote: Frete total calculado: R$${freteTotal} para ${detalhesCalculo.length} itens`);
        
        return {
            valor: freteTotal,
            detalhes: detalhesCalculo
        };
    }
    
    /**
     * Método principal de validação de frete para um pacote
     * Implementação simplificada usando diretamente os dados da API
     */
    async validarFretePorPacote(shipping_id, accessToken) {
        console.log(`validarFretePorPacote: Iniciando validação para shipping_id ${shipping_id}`);
        
        try {
            // 1. Buscar informações básicas do pacote no banco
            const pacoteInfo = await DetalhesVenda.findOne({
                where: { shipping_id: shipping_id },
                attributes: ['venda_id', 'is_sulsudeste', 'is_fulfillment', 'is_pack', 'shipping_cost'],
                raw: true
            });
            
            if (!pacoteInfo) {
                console.warn(`validarFretePorPacote: Pacote ${shipping_id} não encontrado no banco`);
                return {
                    shipping_id: shipping_id,
                    status: 'ERRO_SEM_PACOTE_DB',
                    frete_calculado: null,
                    frete_cobrado: null,
                    mensagem: 'Pacote não encontrado no banco de dados'
                };
            }
            
            const vendaId = pacoteInfo.venda_id;
            const is_sulsudeste = pacoteInfo.is_sulsudeste === 1;
            const is_fulfillment = pacoteInfo.is_fulfillment === 1;
            const isPack = pacoteInfo.is_pack === 1;
            const compradorPagou = pacoteInfo.shipping_cost && Number(pacoteInfo.shipping_cost) > 0;
            
            console.log(`validarFretePorPacote: Informações do pacote - Venda: ${vendaId}, Sul/Sudeste: ${is_sulsudeste}, Fulfillment: ${is_fulfillment}, Pack: ${isPack}`);
            
            // 2. Obter o frete cobrado pela API
            const freteCobradoAPI = await custoEnvioService.obterCustoEnvio(shipping_id, accessToken);
            
            if (freteCobradoAPI === null || freteCobradoAPI === undefined) {
                console.warn(`validarFretePorPacote: Não obteve frete cobrado (API) para ${shipping_id}`);
                return {
                    shipping_id: shipping_id,
                    status: 'ERRO_SEM_FRETE_API',
                    frete_calculado: null,
                    frete_cobrado: null,
                    mensagem: 'Não foi possível obter o valor de frete cobrado via API'
                };
            }
            
            if (Number(freteCobradoAPI) === 0 && compradorPagou) {
                console.log(`validarFretePorPacote: Comprador pagou e senders_cost é 0 para ${shipping_id}`);
                
                // Salvar no banco que o comprador pagou
                await this.salvarValidacao({
                    shipping_id: shipping_id,
                    venda_id: vendaId,
                    frete_calculado: 0,
                    frete_cobrado_api: 0,
                    diferenca: 0,
                    status_validacao: 'COMPRADOR_PAGOU',
                    coluna_tabela_usada: null,
                    is_sulsudeste: is_sulsudeste ? 1 : 0,
                    is_fulfillment: is_fulfillment ? 1 : 0
                });
                
                return {
                    shipping_id: shipping_id,
                    status: 'COMPRADOR_PAGOU',
                    frete_calculado: 0,
                    frete_cobrado: 0,
                    diferenca: 0
                };
            }
            
            // 3. Obter informações do vendedor para seleção da coluna de frete
            const seller_id = await authService.obterSellerId(accessToken);
            if (!seller_id) {
                throw new Error("Não foi possível obter ID do vendedor.");
            }
            
            const sellerDetails = await userService.obterDetalhesUsuario(seller_id);
            const sellerReputationLevelId = sellerDetails?.seller_reputation?.level_id;
            
            // 4. Obter os itens diretamente da API (método simplificado)
            const itens = await this.obterItensPorShipmentApi(shipping_id, accessToken);
            
            if (!itens || itens.length === 0) {
                console.warn(`validarFretePorPacote: Nenhum item encontrado para o pacote ${shipping_id}`);
                return {
                    shipping_id: shipping_id,
                    status: 'ERRO_SEM_ITENS',
                    frete_calculado: null,
                    frete_cobrado: freteCobradoAPI,
                    mensagem: 'Não foi possível obter os itens do pacote'
                };
            }
            
            // 5. Determinar a coluna de frete inicial
            // Verificar se há categorias especiais e itens novos>=79
            let temCategoriaEspecial = false;
            let temItemNovo79 = false;
            let allItemIds = [];
            
            for (const item of itens) {
                allItemIds.push(item.id);
                
                if (item.condition === 'new' && Number(item.price) >= 79) {
                    temItemNovo79 = true;
                }
                
                if (item.category_id) {
                    const isEspecial = await specialCategoryService.isSpecialCategory(item.category_id);
                    if (isEspecial) {
                        temCategoriaEspecial = true;
                    }
                }
            }
            
            // 6. Selecionar coluna de frete para o primeiro item
            const dadoFreteItem = {
                is_sulsudeste: is_sulsudeste,
                is_special_category: temCategoriaEspecial ? 1 : 0,
                is_fulfillment: is_fulfillment,
                total_amount: itens[0]?.price || 0
            };
            
            const itemProxy = {
                condition: itens[0]?.condition || 'used',
                price: itens[0]?.price || 0,
                category_id: itens[0]?.category_id
            };
            
            const colunaFreteUsada = await FreteService.selecionarColunaFrete(
                dadoFreteItem,
                itemProxy,
                sellerReputationLevelId
            );
            
            console.log(`validarFretePorPacote: Coluna de frete selecionada: ${colunaFreteUsada}`);
            
            // 7. Calcular o frete total do pacote
            const resultadoFretePacote = await this.calcularFreteTotalPacote(
                itens,
                colunaFreteUsada,
                is_sulsudeste,
                is_fulfillment,
                sellerReputationLevelId
            );
            
            if (!resultadoFretePacote || resultadoFretePacote.valor <= 0) {
                console.warn(`validarFretePorPacote: Falha ao calcular frete total para o pacote ${shipping_id}`);
                return {
                    shipping_id: shipping_id,
                    status: 'ERRO_CALCULO_FRETE',
                    frete_calculado: null,
                    frete_cobrado: freteCobradoAPI,
                    mensagem: 'Não foi possível calcular o frete total do pacote'
                };
            }
            
            const freteCalculado = resultadoFretePacote.valor;
            const detalhesCalculo = resultadoFretePacote.detalhes;
            
            // 8. Comparar com o frete cobrado pela API
            console.log(`validarFretePorPacote: Frete calculado: R$${freteCalculado}, Frete cobrado API: R$${freteCobradoAPI}`);
            
            const diferenca = Number(freteCalculado) - Number(freteCobradoAPI);
            let statusFinal = 'CORRETO';
            
            if (Math.abs(diferenca) <= 0.5) {
                statusFinal = 'CORRETO';
                console.log(`validarFretePorPacote: Diferença menor que R$0,50, status: ${statusFinal}`);
            } else if (diferenca > 0) {
                statusFinal = 'COBRANDO_MENOS';
                console.log(`validarFretePorPacote: ML está cobrando menos R$${diferenca.toFixed(2)}, status: ${statusFinal}`);
            } else {
                statusFinal = 'COBRANDO_MAIS';
                console.log(`validarFretePorPacote: ML está cobrando mais R$${Math.abs(diferenca).toFixed(2)}, status: ${statusFinal}`);
            }
            
            // Adicionar tag MULTIPLO se houver múltiplos itens
            if (itens.length > 1) {
                statusFinal = `${statusFinal}_MULTIPLO`;
            }
            
            // 9. Salvar a validação no banco
            const validacaoDados = {
                shipping_id: shipping_id,
                venda_id: vendaId,
                frete_calculado: freteCalculado,
                frete_cobrado_api: freteCobradoAPI,
                diferenca: diferenca,
                status_validacao: statusFinal,
                coluna_tabela_usada: colunaFreteUsada,
                is_sulsudeste: is_sulsudeste ? 1 : 0,
                is_special_category: temCategoriaEspecial ? 1 : 0,
                is_fulfillment: is_fulfillment ? 1 : 0,
                is_novo_79: temItemNovo79 ? 1 : 0,
                quantidade_itens: itens.length,
                item_ids: JSON.stringify(allItemIds),
                mensagem_erro: itens.length > 1 ? JSON.stringify(detalhesCalculo) : null
            };
            
            await this.salvarValidacao(validacaoDados);
            
            return {
                shipping_id: shipping_id,
                status: statusFinal,
                frete_calculado: freteCalculado,
                frete_cobrado: freteCobradoAPI,
                diferenca: diferenca,
                coluna_frete: colunaFreteUsada
            };
            
        } catch (error) {
            console.error(`validarFretePorPacote: Erro durante validação: ${error.message}`);
            
            // Em caso de erro, tentar salvar o que temos
            try {
                await this.salvarValidacao({
                    shipping_id: shipping_id,
                    status_validacao: 'ERRO',
                    mensagem_erro: error.message
                });
            } catch (finalError) {
                console.error(`validarFretePorPacote: Erro ao salvar validação de erro: ${finalError.message}`);
            }
            
            return {
                shipping_id: shipping_id,
                status: 'ERRO',
                frete_calculado: null,
                frete_cobrado: null,
                mensagem: error.message
            };
        }
    }
    
    /**
     * Método auxiliar para salvar a validação no banco
     */
    async salvarValidacao(dados) {
        try {
            // Verificar se já existe
            const validacaoExistente = await ValidacaoPacote.findOne({
                where: { shipping_id: dados.shipping_id }
            });
            
            if (validacaoExistente) {
                await ValidacaoPacote.update(dados, {
                    where: { shipping_id: dados.shipping_id }
                });
                console.log(`salvarValidacao: Validação atualizada para ${dados.shipping_id}`);
            } else {
                await ValidacaoPacote.create(dados);
                console.log(`salvarValidacao: Validação criada para ${dados.shipping_id}`);
            }
            
            return true;
        } catch (error) {
            console.error(`salvarValidacao: Erro ao salvar validação: ${error.message}`);
            return false;
        }
    }
}

// Exportar a classe
module.exports = new ValidacaoFreteService();
