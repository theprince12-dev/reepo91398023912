// src/services/validacaoFreteService2025.js
const FreteService2025 = require('./freteService2025');
const { DetalhesVenda, ValidacaoPacote2025 } = require('../../models');
const specialCategoryService = require('./specialCategoryService');
const userService = require('./userService');
const authService = require('./authService');
const itemService = require('./itemService');
const custoEnvioService = require('./custoEnvioService');
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');

// Função auxiliar para calcular peso volumétrico (caso não esteja definida em outro lugar)
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

// Data de início para validação com as novas regras
const DATA_INICIO_NOVAS_REGRAS = new Date('2025-05-21T00:00:00-03:00');

class ValidacaoFreteService2025 {
    // Verifica se deve usar a validação 2025 baseado na data
    deveUsarValidacao2025(dataVenda) {
        if (!dataVenda) return false;
        
        let data;
        try {
            data = new Date(dataVenda);
        } catch (e) {
            console.error('Erro ao converter data:', e);
            return false;
        }
        
        return data >= DATA_INICIO_NOVAS_REGRAS;
    }
    
    // Método para calcular o frete total de um pacote considerando todos os itens
    async calcularFreteTotalPacote(itensDetalhados, colunaFrete, is_sulsudeste, is_fulfillment, sellerReputationLevelId, accessToken, shipping_id) {
        console.log(`calcularFreteTotalPacote2025: Iniciando cálculo de frete para ${itensDetalhados.length} itens no pacote`);
        
        if (!itensDetalhados || itensDetalhados.length === 0) {
            console.warn(`calcularFreteTotalPacote2025: Nenhum item para calcular frete`);
            return null;
        }
        
        let freteTotal = 0;
        const detalhesCalculo = [];
        
        // Calcular o frete para cada item e somar
        for (const itemInfo of itensDetalhados) {
            if (!itemInfo.api) {
                console.warn(`calcularFreteTotalPacote2025: Item sem detalhes da API, não é possível calcular frete`);
                continue;
            }
            
            const item = {
                id: itemInfo.id,
                price: itemInfo.api.price || 0,
                condition: itemInfo.api.condition || 'used',
                category_id: itemInfo.api.category_id,
                dimensions: itemInfo.api.dimensions || itemInfo.api.shipping?.dimensions || {}
            };
            
            const freteItem = await this.calcularFreteIndividual(
                item,
                colunaFrete,
                is_sulsudeste,
                is_fulfillment,
                sellerReputationLevelId,
                accessToken,
                shipping_id
            );
            
            if (freteItem !== null) {
                // Multiplicar pelo quantity se disponível
                const quantidade = itemInfo.quantity || 1;
                const freteItemTotal = freteItem * quantidade;
                freteTotal += freteItemTotal;
                
                detalhesCalculo.push({
                    item_id: item.id,
                    frete_unitario: freteItem,
                    quantidade: quantidade,
                    subtotal: freteItemTotal
                });
                
                console.log(`calcularFreteTotalPacote2025: Item ${item.id} - Frete unitário: R$${freteItem}, Qtd: ${quantidade}, Subtotal: R$${freteItemTotal}`);
            }
        }
        
        console.log(`calcularFreteTotalPacote2025: Frete total calculado: R$${freteTotal} para ${detalhesCalculo.length} itens`);
        console.log(`calcularFreteTotalPacote2025: Detalhes do cálculo:`, JSON.stringify(detalhesCalculo));
        
        return {
            valor: freteTotal,
            detalhes: detalhesCalculo
        };
    }

    // Busca dimensões de um item no banco de dados ou através da API
    async obterDimensoesItem(itemId, accessToken, shippingId = null) {
        try {
            console.log(`obterDimensoesItem2025: Buscando dimensões para item ${itemId}`);
            
            // 1. Primeiro: tente obter dimensões do item via API se temos access token
            if (accessToken && shippingId) {
                try {
                    console.log(`obterDimensoesItem2025: Tentando obter via API para shipping ${shippingId}, item ${itemId}`);
                    // Buscar todos os itens do shipment
                    const itensShipment = await this.obterItensPorShipment(shippingId, accessToken);
                    
                    if (itensShipment && itensShipment.length > 0) {
                        // Encontrar o item específico
                        const itemEncontrado = itensShipment.find(item => item.id === itemId);
                        
                        if (itemEncontrado && itemEncontrado.dimensions) {
                            const dimensions = itemEncontrado.dimensions;
                            console.log(`obterDimensoesItem2025: Dimensões encontradas na API para ${itemId}:`, JSON.stringify(dimensions));
                            
                            // Se encontrou dimensões válidas, salvar no banco para uso futuro
                            if (dimensions.width && dimensions.length && dimensions.height && dimensions.weight) {
                                this.salvarDimensoesItem(itemId, shippingId, dimensions);
                                return dimensions;
                            }
                        }
                    }
                } catch (apiError) {
                    console.warn(`obterDimensoesItem2025: Erro ao buscar da API: ${apiError.message}`);
                }
            }
            
            // 2. Se API falhar ou não fornecer dados completos, tentar do banco de dados
            // Importar modelo DimensaoPacote para evitar dependência circular
            const { DimensaoPacote, DetalhesVenda } = require('../../models');
            
            // Primeiro tentar buscar direto por item_id se a coluna existir
            let dimensoes = null;
            try {
                dimensoes = await DimensaoPacote.findOne({
                    where: { item_id: itemId },
                    attributes: ['width', 'length', 'height', 'weight'],
                    raw: true
                });
            } catch (error) {
                // A coluna item_id pode não existir, então ignoramos este erro específico
                console.log(`obterDimensoesItem2025: Coluna item_id não disponível em DimensaoPacote`);
            }
            
            // Se não encontrou por item_id, tenta buscar por shipping_id através de DetalhesVenda
            if (!dimensoes && shippingId) {
                dimensoes = await DimensaoPacote.findOne({
                    where: { shipment_id: shippingId },
                    attributes: ['width', 'length', 'height', 'weight'],
                    raw: true
                });
            }
            
            // Se ainda não encontrou e não tem shipping_id, tenta buscar o shipping_id relacionado ao item
            if (!dimensoes && !shippingId) {
                const detalheVenda = await DetalhesVenda.findOne({
                    where: { order_item_id: itemId },
                    attributes: ['shipping_id'],
                    raw: true
                });
                
                if (detalheVenda && detalheVenda.shipping_id) {
                    dimensoes = await DimensaoPacote.findOne({
                        where: { shipment_id: detalheVenda.shipping_id },
                        attributes: ['width', 'length', 'height', 'weight'],
                        raw: true
                    });
                }
            }
            
            if (dimensoes) {
                console.log(`obterDimensoesItem2025: Dimensões encontradas no DB para ${itemId}:`, JSON.stringify(dimensoes));
                return {
                    width: dimensoes.width,
                    length: dimensoes.length,
                    height: dimensoes.height,
                    weight: dimensoes.weight
                };
            } else {
                console.log(`obterDimensoesItem2025: Nenhuma dimensão encontrada para ${itemId}`);
                return null;
            }
        } catch (error) {
            console.error(`obterDimensoesItem2025: Erro ao buscar dimensões: ${error}`);
            return null;
        }
    }
    
    // Salva as dimensões de um item no banco de dados para uso futuro
    async salvarDimensoesItem(itemId, shippingId, dimensions) {
        try {
            const { DimensaoPacote } = require('../../models');
            
            // Verificar se já existe registro para este shipping_id
            const existente = await DimensaoPacote.findOne({
                where: { shipment_id: shippingId }
            });
            
            if (existente) {
                // Atualizar registro existente
                await DimensaoPacote.update({
                    width: dimensions.width,
                    length: dimensions.length,
                    height: dimensions.height,
                    weight: dimensions.weight
                }, {
                    where: { shipment_id: shippingId }
                });
                console.log(`salvarDimensoesItem2025: Dimensões atualizadas para shipment ${shippingId}, item ${itemId}`);
            } else {
                // Criar novo registro
                await DimensaoPacote.create({
                    shipment_id: shippingId,
                    width: dimensions.width,
                    length: dimensions.length,
                    height: dimensions.height,
                    weight: dimensions.weight
                });
                console.log(`salvarDimensoesItem2025: Dimensões salvas para shipment ${shippingId}, item ${itemId}`);
            }
        } catch (error) {
            console.error(`salvarDimensoesItem2025: Erro ao salvar dimensões: ${error.message}`);
        }
    }

    // Busca os itens de um envio pelo shipment_id
    async obterItensPorShipment(shipmentId, accessToken) {
        console.log(`obterItensPorShipment2025: Obtendo itens para shipment ${shipmentId}`);
        if (!shipmentId || !accessToken) {
            console.error(`obterItensPorShipment2025: Parâmetros inválidos - shipmentId: ${shipmentId}`);
            return null;
        }
        
        try {
            // 1. Primeiro, obter os MLB IDs do banco de dados
            const detalhesVendas = await DetalhesVenda.findAll({
                where: { shipping_id: shipmentId },
                attributes: ['order_item_id', 'venda_id'],
                raw: true
            });
            
            if (!detalhesVendas || detalhesVendas.length === 0) {
                console.warn(`obterItensPorShipment2025: Não foram encontrados MLBs no banco para o shipment ${shipmentId}`);
                
                // Fallback para API original caso não encontremos no banco de dados
                return await this.obterItensPorShipmentApi(shipmentId, accessToken);
            }
            
            const mlbIds = detalhesVendas.map(d => d.order_item_id).filter(Boolean);
            const vendaId = detalhesVendas[0]?.venda_id;
            
            console.log(`obterItensPorShipment2025: MLB IDs encontrados no banco de dados: ${JSON.stringify(mlbIds)}, venda ID: ${vendaId}`);
            
            // 2. Para cada MLB ID, obter informações completas
            const enrichedItems = [];
            
            for (const mlbId of mlbIds) {
                try {
                    // Obter detalhes do item via API
                    const itemDetail = await itemService.getItemById(mlbId, accessToken);
                    
                    if (itemDetail) {
                        // Verificar se temos dimensões
                        let dimensions = null;
                        try {
                            dimensions = itemDetail.dimensions || itemDetail.shipping?.dimensions || {};
                        } catch (dimError) {
                            console.warn(`obterItensPorShipment2025: Erro ao obter dimensões do item ${mlbId}: ${dimError.message}`);
                        }
                        
                        // Obter quantidade do item no pedido
                        let quantity = 1;
                        if (vendaId) {
                            const qtdItem = await this.obterQuantidadeItemPedido(vendaId, mlbId, accessToken);
                            if (qtdItem && qtdItem > 0) {
                                quantity = qtdItem;
                            }
                        }
                        
                        // Criar item enriquecido com todas as informações necessárias
                        const enrichedItem = {
                            id: mlbId, // Garantir que o ID está definido e é o MLB correto
                            price: itemDetail.price || 0,
                            condition: itemDetail.condition || 'used',
                            category_id: itemDetail.category_id,
                            dimensions: dimensions,
                            quantity: quantity
                        };
                        
                        console.log(`obterItensPorShipment2025: Item ${mlbId} enriquecido - preço: ${enrichedItem.price}, condição: ${enrichedItem.condition}, quantidade: ${quantity}`);
                        enrichedItems.push(enrichedItem);
                    } else {
                        console.warn(`obterItensPorShipment2025: Não foi possível obter detalhes do item ${mlbId}`);
                    }
                } catch (itemError) {
                    console.error(`obterItensPorShipment2025: Erro ao processar item ${mlbId}: ${itemError.message}`);
                }
            }
            
            if (enrichedItems.length > 0) {
                return enrichedItems;
            } else {
                console.warn(`obterItensPorShipment2025: Nenhum item pôde ser processado do banco de dados`);
                
                // Fallback para API original
                return await this.obterItensPorShipmentApi(shipmentId, accessToken);
            }
        } catch (error) {
            console.error(`obterItensPorShipment2025: Erro ao processar itens do banco: ${error.message}`);
            
            // Fallback para API original em caso de erro
            return await this.obterItensPorShipmentApi(shipmentId, accessToken);
        }
    }
    
    // Método original para obter itens via API (usado como fallback)
    async obterItensPorShipmentApi(shipmentId, accessToken) {
        console.log(`obterItensPorShipmentApi2025: Fallback - Obtendo itens da API para shipment ${shipmentId}`);
        const url = `${config.api_base_url}/shipments/${shipmentId}/items`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`obterItensPorShipmentApi2025: Erro ${response.status} ao buscar itens de shipment ${shipmentId}: ${errorBody}`);
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado ao buscar itens de shipment ${shipmentId}.` };
                return null;
            }
            const itemsData = await response.json();
            if (Array.isArray(itemsData) && itemsData.length > 0) {
                console.log(`obterItensPorShipmentApi2025: Encontrado ${itemsData.length} itens para shipment ${shipmentId}`);
                
                // Buscar MLBs no banco para esse shipment
                const detalhesVendas = await DetalhesVenda.findAll({
                    where: { shipping_id: shipmentId },
                    attributes: ['order_item_id'],
                    raw: true
                });
                
                const mlbIds = detalhesVendas.map(d => d.order_item_id).filter(Boolean);
                
                // Tentar associar MLBs com itens
                const enrichedItems = [];
                for (let i = 0; i < itemsData.length; i++) {
                    try {
                        const item = itemsData[i];
                        // Associar MLB ID da mesma posição, se disponível
                        const mlbId = i < mlbIds.length ? mlbIds[i] : item.id;
                        
                        let itemDetail = null;
                        if (mlbId) {
                            itemDetail = await itemService.getItemById(mlbId, accessToken);
                        }
                        
                        if (itemDetail) {
                            // Criar item enriquecido usando dados da API e do item encontrado
                            const enrichedItem = {
                                ...item,
                                id: mlbId,
                                price: itemDetail.price || item.price || 0,
                                condition: itemDetail.condition || item.condition || 'used',
                                category_id: itemDetail.category_id || item.category_id
                            };
                            enrichedItems.push(enrichedItem);
                            console.log(`obterItensPorShipmentApi2025: Item ${mlbId} enriquecido - preço: ${enrichedItem.price}, condição: ${enrichedItem.condition}`);
                        } else {
                            // Se não conseguiu enriquecer, adicionar item original
                            console.warn(`obterItensPorShipmentApi2025: Usando dados originais para item na posição ${i}`);
                            enrichedItems.push({
                                ...item,
                                id: mlbId || item.id
                            });
                        }
                    } catch (itemError) {
                        console.error(`obterItensPorShipmentApi2025: Erro processando item: ${itemError.message}`);
                        enrichedItems.push(itemsData[i]); // Adicionar item original em caso de erro
                    }
                }
                
                return enrichedItems;
            } else {
                console.warn(`obterItensPorShipmentApi2025: Nenhum item encontrado para shipment ${shipmentId}`);
                return [];
            }
        } catch (error) {
            console.error(`obterItensPorShipmentApi2025: Erro na chamada API para shipment ${shipmentId}:`, error);
            if (error.name === 'TokenError') throw error;
            return null;
        }
    }

    // Calcula o frete para um item individual 
    async calcularFreteIndividual(item, colunaFreteInicial, is_sulsudeste, is_fulfillment, sellerReputationLevelId, accessToken = null, shippingId = null) {
        console.log(`calcularFreteIndividual2025: Calculando frete para item individual:`, item.id);
        try {
            // Garantir que temos informações completas do item antes de continuar
            let itemCompleto = item;
            
            // Se não temos o preço ou condição, tentar obter os detalhes do item
            if (!item.price || !item.condition) {
                try {
                    const detalhesItem = await itemService.getItemById(item.id, accessToken);
                    if (detalhesItem) {
                        console.log(`calcularFreteIndividual2025: Detalhes adicionais obtidos para item ${item.id} - preço: ${detalhesItem.price}, condição: ${detalhesItem.condition}`);
                        itemCompleto = {
                            ...item,
                            price: detalhesItem.price || item.price || 0,
                            condition: detalhesItem.condition || item.condition || 'used',
                            category_id: detalhesItem.category_id || item.category_id
                        };
                    }
                } catch (detailError) {
                    console.warn(`calcularFreteIndividual2025: Erro ao obter detalhes completos do item ${item.id}: ${detailError.message}`);
                    // Continuar com os dados que temos
                }
            }
            
            // Extrair propriedades do item - verificar dimensões em ambos os locais possíveis
            let dimensions = itemCompleto.dimensions || itemCompleto.shipping?.dimensions || {};
            console.log(`calcularFreteIndividual2025: Dimensões iniciais da API para item ${itemCompleto.id}:`, JSON.stringify(dimensions));
            
            // Verificar se as dimensões da API estão vazias ou incompletas
            const dimensionsEmpty = !dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight;
            
            // Se dimensions estiverem vazias ou incompletas, tenta buscar usando o método melhorado
            if (dimensionsEmpty) {
                console.log(`calcularFreteIndividual2025: Dimensões da API incompletas ou vazias para ${itemCompleto.id}, buscando via método otimizado`);
                const completeDimensions = await this.obterDimensoesItem(itemCompleto.id, accessToken, shippingId);
                if (completeDimensions) {
                    console.log(`calcularFreteIndividual2025: Dimensões completas encontradas para ${itemCompleto.id}:`, JSON.stringify(completeDimensions));
                    dimensions = completeDimensions;
                } else {
                    console.log(`calcularFreteIndividual2025: Nenhuma dimensão completa encontrada para ${itemCompleto.id}`);
                }
            }
            
            const peso_g = dimensions.weight || 0;
            const peso_kg = peso_g > 0 ? Number((peso_g / 1000).toFixed(4)) : 0;
            
            // Calcular peso volumétrico baseado nas dimensões
            const comprimento = dimensions.length || 0;
            const largura = dimensions.width || 0; 
            const altura = dimensions.height || 0;
            const pesoVolumetrico = calcularPesoVolumetricoKg(comprimento, largura, altura);
            
            console.log(`calcularFreteIndividual2025: Dimensões finais utilizadas para ${itemCompleto.id}: ${comprimento}cm x ${largura}cm x ${altura}cm, peso ${peso_g}g`);
            console.log(`calcularFreteIndividual2025: Peso volumétrico calculado para ${itemCompleto.id}: ${pesoVolumetrico}kg`);
            console.log(`calcularFreteIndividual2025: Peso real em kg para ${itemCompleto.id}: ${peso_kg}kg`);
            
            // Garantir que ambos os valores são números válidos antes de comparar
            const pesoRealValido = typeof peso_kg === 'number' && !isNaN(peso_kg) ? peso_kg : 0;
            const pesoVolumetricoValido = typeof pesoVolumetrico === 'number' && !isNaN(pesoVolumetrico) ? pesoVolumetrico : 0;
            
            // Usar o maior entre peso real e volumétrico
            const pesoCobravel = Math.max(pesoRealValido, pesoVolumetricoValido);
            
            console.log(`calcularFreteIndividual2025: Comparando pesos para ${itemCompleto.id} - Real: ${pesoRealValido}kg, Volumétrico: ${pesoVolumetricoValido}kg, Escolhido: ${pesoCobravel}kg`);
            
            if (pesoCobravel <= 0) {
                console.warn(`calcularFreteIndividual2025: Peso cobrável inválido para item ${itemCompleto.id}`);
                return null;
            }
            
            // Verificar categoria especial para este item específico
            let is_special_category = 0;
            if (itemCompleto.category_id) {
                is_special_category = await specialCategoryService.isSpecialCategory(itemCompleto.category_id);
                console.log(`calcularFreteIndividual2025: Item ${itemCompleto.id} - Categoria ${itemCompleto.category_id} é especial: ${is_special_category}`);
            }
            
            // Garantir que o preço é um número
            const itemPrice = Number(itemCompleto.price) || 0;
            console.log(`calcularFreteIndividual2025: Item ${itemCompleto.id} - Preço: R$${itemPrice}, Condição: ${itemCompleto.condition}`);
            
            // Determinar a coluna de frete específica para este item
            const dadosItemParaColuna = {
                is_sulsudeste: is_sulsudeste, 
                is_special_category: is_special_category,
                is_fulfillment: is_fulfillment,
                total_amount: itemPrice
            };
            
            // IMPORTANTE: Usar o preço real do item e a condição correta
            const itemProxyParaColuna = {
                condition: itemCompleto.condition || 'used',
                price: itemPrice, // Preço real do item para seleção da coluna
                category_id: itemCompleto.category_id
            };
            
            // Obter coluna de frete específica para este item usando a nova lógica de 2025
            const colunaFreteItem = await FreteService2025.selecionarColunaFrete(
                dadosItemParaColuna, 
                itemProxyParaColuna, 
                sellerReputationLevelId
            );
            
            console.log(`calcularFreteIndividual2025: Item ${item.id} - Coluna inicial: ${colunaFreteInicial}, Coluna específica do item: ${colunaFreteItem}`);
            
            // Usar a coluna específica do item para cálculo (se disponível)
            const colunaUsada = colunaFreteItem || colunaFreteInicial;
            
            // Obter faixa de peso e valor do frete usando o serviço 2025
            const faixaPeso = await FreteService2025.obterFaixaPeso(peso_kg, pesoVolumetrico);
            const valorFrete = await FreteService2025.obterValorFrete(faixaPeso, colunaUsada);
            
            console.log(`calcularFreteIndividual2025: Item ${item.id}, Peso: ${pesoCobravel}kg, Faixa: ${faixaPeso}, Coluna usada: ${colunaUsada}, Valor: ${valorFrete}`);
            return valorFrete;
        } catch (error) {
            console.error(`calcularFreteIndividual2025: Erro ao calcular frete individual:`, error);
            return null;
        }
    }

    // Busca a quantidade de um item específico dentro de um pedido via API
    async obterQuantidadeItemPedido(vendaId, orderItemId, accessToken) {
        console.log(`obterQuantidadeItemPedido2025: Buscando quantidade para item ${orderItemId} na venda ${vendaId}`);
        if (!vendaId || !orderItemId || !accessToken) {
            console.error("obterQuantidadeItemPedido2025: IDs inválidos ou token ausente.");
            return null;
        }
        const url = `${config.api_base_url}/orders/${vendaId}`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`obterQuantidadeItemPedido2025: Erro ${response.status} ao buscar pedido ${vendaId}: ${errorBody}`);
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado ao buscar pedido ${vendaId}.` };
                return null;
            }
            const orderData = await response.json();
            if (orderData && Array.isArray(orderData.order_items)) {
                const itemEncontrado = orderData.order_items.find(item => item.item?.id === orderItemId);
                if (itemEncontrado && itemEncontrado.quantity !== undefined && !isNaN(Number(itemEncontrado.quantity))) {
                    const quantity = Number(itemEncontrado.quantity);
                    console.log(`obterQuantidadeItemPedido2025: Quantidade encontrada: ${quantity}`);
                    return quantity;
                } else {
                    console.warn(`obterQuantidadeItemPedido2025: Item ${orderItemId} não encontrado ou sem quantidade numérica na resposta do pedido ${vendaId}.`);
                }
            } else {
                console.warn(`obterQuantidadeItemPedido2025: Array 'order_items' não encontrado ou inválido na resposta do pedido ${vendaId}.`);
            }
        } catch (error) {
            console.error(`obterQuantidadeItemPedido2025: Erro na chamada API para pedido ${vendaId}:`, error);
            if (error.name === 'TokenError') throw error;
        }
        return null;
    }

    async validarFretePorPacote(shipping_id, accessToken) {
        console.log(`validarFretePorPacote2025: Iniciando validação para shipping_id ${shipping_id}`);
        let vendaIdDoPacote = null;
        let freteCalculado = null;
        let colunaFreteUsada = null;
        let freteCobradoAPI = null;
        let statusFinal = 'ERRO_DESCONHECIDO';
        let mensagemErro = null;
        let allItemIds = [];
        let compradorPagou = false;
        let isPack = false;
        let totalQuantity = 0;
        let primeiroItemInfo = null;
        let dataVenda = null;

        try {
            const itensDoPacoteDB = await DetalhesVenda.findAll({
                where: { shipping_id: shipping_id },
                attributes: ['venda_id', 'order_item_id', 'volume', 'weight', 'is_sulsudeste', 'is_fulfillment', 'total_amount', 'shipping_cost', 'is_pack', 'date_created'],
                raw: true
            });

            if (!itensDoPacoteDB || itensDoPacoteDB.length === 0) {
                 console.warn(`validarFretePorPacote2025: Nenhum item DB para ${shipping_id}.`);
                 statusFinal = 'ERRO_SEM_ITENS_DB';
             } else {
                 allItemIds = itensDoPacoteDB.map(item => item.order_item_id);
                 const dadosComuns = itensDoPacoteDB[0];
                 vendaIdDoPacote = dadosComuns.venda_id;
                 dataVenda = dadosComuns.date_created;
                 
                 console.log(`DEBUG - dadosComuns lido do DB para ${shipping_id}:`, JSON.stringify(dadosComuns));
                 console.log(`DEBUG - vendaIdDoPacote definido como: ${vendaIdDoPacote} para ${shipping_id}`);
                 console.log(`DEBUG - Data da venda: ${dataVenda}`);
                 
                 if (!vendaIdDoPacote) { console.error(`ERRO: venda_id nulo para ${shipping_id}!`); }
                 
                 // Verificar se deve usar validação 2025 baseada na data
                 if (!this.deveUsarValidacao2025(dataVenda)) {
                     console.log(`validarFretePorPacote2025: Venda ${vendaIdDoPacote} com data ${dataVenda} é anterior a 21/05/2025, ignorando validação 2025`);
                     return {
                         shipping_id: shipping_id,
                         status: 'IGNORADO_DATA_ANTERIOR',
                         mensagem: `Venda anterior a 21/05/2025 (${dataVenda})`
                     };
                 }
                 
                 console.log(`validarFretePorPacote2025: Venda ${vendaIdDoPacote} com data ${dataVenda} será validada pela tabela 2025`);

                 const chargeable_weight_kg = dadosComuns.volume;
                 const actual_weight_kg = dadosComuns.weight;
                 const is_sulsudeste_do_pacote = dadosComuns.is_sulsudeste; 
                 const is_fulfillment_do_pacote = dadosComuns.is_fulfillment;
                 isPack = dadosComuns.is_pack === 1;

                 if (dadosComuns.shipping_cost && Number(dadosComuns.shipping_cost) > 0) {
                     compradorPagou = true;
                     console.log(`validarFretePorPacote2025: Comprador pagou R$ ${dadosComuns.shipping_cost} para ${shipping_id} (Venda: ${vendaIdDoPacote}).`);
                 }

                 if (chargeable_weight_kg === null || chargeable_weight_kg === undefined || isNaN(Number(chargeable_weight_kg))) {
                    console.warn(`validarFretePorPacote2025: Peso cobrável inválido para ${shipping_id} (Venda: ${vendaIdDoPacote}).`);
                    statusFinal = 'ERRO_SEM_PESO';
                 } else {
                     freteCobradoAPI = await custoEnvioService.obterCustoEnvio(shipping_id, accessToken);
                     if (freteCobradoAPI === null || freteCobradoAPI === undefined) {
                         console.warn(`validarFretePorPacote2025: Não obteve frete cobrado (API) para ${shipping_id} (Venda: ${vendaIdDoPacote}).`);
                         statusFinal = 'AVISO_SEM_FRETE_API';
                     } else if (Number(freteCobradoAPI) === 0 && compradorPagou) {
                         console.log(`validarFretePorPacote2025: Comprador pagou e senders_cost é 0 para ${shipping_id} (Venda: ${vendaIdDoPacote}).`);
                         statusFinal = 'COMPRADOR_PAGOU';
                     }

                     const seller_id = await authService.obterSellerId(accessToken);
                     if (!seller_id) throw new Error("Não foi possível obter ID do vendedor.");
                     const sellerDetails = await userService.obterDetalhesUsuario(seller_id);
                     const sellerReputationLevelId = sellerDetails?.seller_reputation?.level_id;

                     let temItemNovo79 = false;
                     let temItemNovo100 = false;
                     let temItemNovo120 = false;
                     let temItemNovo150 = false;
                     let temItemNovo200 = false;
                     let temCategoriaEspecial = false;
                     totalQuantity = 0;

                     const itemDetailsPromises = itensDoPacoteDB.map(async (itemVenda) => {
                         const itemAPI = await itemService.getItemById(itemVenda.order_item_id, accessToken);
                         
                         const itemQuantity = await this.obterQuantidadeItemPedido(vendaIdDoPacote, itemVenda.order_item_id, accessToken) || 1;
                         totalQuantity += itemQuantity;
                         
                         if (itemAPI) {
                             // Verificação de preços para a nova lógica de 2025
                             const itemPrice = Number(itemAPI.price) || 0;
                             if (itemAPI.condition === 'new') {
                                 if (itemPrice >= 79 && itemPrice < 100) {
                                     temItemNovo79 = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} é novo>=79 (preço: ${itemAPI.price})`);
                                 } else if (itemPrice >= 100 && itemPrice < 120) {
                                     temItemNovo100 = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} é novo>=100 (preço: ${itemAPI.price})`);
                                 } else if (itemPrice >= 120 && itemPrice < 150) {
                                     temItemNovo120 = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} é novo>=120 (preço: ${itemAPI.price})`);
                                 } else if (itemPrice >= 150 && itemPrice < 200) {
                                     temItemNovo150 = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} é novo>=150 (preço: ${itemAPI.price})`);
                                 } else if (itemPrice >= 200) {
                                     temItemNovo200 = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} é novo>=200 (preço: ${itemAPI.price})`);
                                 }
                             }
                             
                             if (itemAPI.category_id) {
                                 const isEspecial = await specialCategoryService.isSpecialCategory(itemAPI.category_id);
                                 if (isEspecial) {
                                     temCategoriaEspecial = true;
                                     console.log(`validarFretePorPacote2025: Item ${itemVenda.order_item_id} tem categoria especial ${itemAPI.category_id}`);
                                 }
                             }
                             
                         // Guardar primeiro item como referência
                         if (!primeiroItemInfo) {
                             primeiroItemInfo = {
                                 id: itemAPI.id,
                                 price: itemAPI.price,
                                 condition: itemAPI.condition,
                                 category_id: itemAPI.category_id,
                                 dimensions: itemAPI.shipping?.dimensions || {}
                             };
                         }
                         } else {
                             console.warn(`validarFretePorPacote2025: Não foi possível obter detalhes do item ${itemVenda.order_item_id} via API`);
                         }
                         
                         return {
                             id: itemVenda.order_item_id,
                             api: itemAPI,
                             quantity: itemQuantity
                         };
                     });
                     
                     // Aguardar todos os itens serem processados
                     const itensDetalhados = await Promise.all(itemDetailsPromises);
                     
                     console.log(`validarFretePorPacote2025: Total de ${totalQuantity} itens no pacote ${shipping_id} (Venda: ${vendaIdDoPacote}).`);
                     
                     ////////////////////////////////////////////////////////////////////////////
                     // Determinar a coluna de frete correta baseada nas características do pacote
                     const is_sulsudeste = is_sulsudeste_do_pacote === 1;
                     const is_fulfillment = is_fulfillment_do_pacote === 1;
                     
                     console.log(`validarFretePorPacote2025: Dados - Sul/Sudeste: ${is_sulsudeste}, Fulfillment: ${is_fulfillment}, Pack: ${isPack}`);
                     console.log(`validarFretePorPacote2025: Dados - Item novo: 79=${temItemNovo79}, 100=${temItemNovo100}, 120=${temItemNovo120}, 150=${temItemNovo150}, 200=${temItemNovo200}`);
                     console.log(`validarFretePorPacote2025: Dados - Categoria especial: ${temCategoriaEspecial}`);
                     
                     // Primeiro selecionar a coluna de frete pelo item principal
                     const dadoFreteItem = {
                         is_sulsudeste: is_sulsudeste,
                         is_special_category: temCategoriaEspecial ? 1 : 0,
                         is_fulfillment: is_fulfillment,
                         total_amount: primeiroItemInfo?.price || 0
                     };
                     
                     const itemProxy = {
                         condition: primeiroItemInfo?.condition || 'used',
                         price: primeiroItemInfo?.price || 0,
                         category_id: primeiroItemInfo?.category_id
                     };
                     
                     colunaFreteUsada = await FreteService2025.selecionarColunaFrete(
                         dadoFreteItem,
                         itemProxy,
                         sellerReputationLevelId
                     );
                     
                     console.log(`validarFretePorPacote2025: Coluna de frete selecionada: ${colunaFreteUsada}`);
                     
                     let detalhesCalculoMultiplo = null;
                     let statusPack = '';

                     // Se for pacote com múltiplos itens, calcular frete para cada item e somar
                     if (isPack && itensDetalhados.length > 1) {
                         console.log(`validarFretePorPacote2025: Pacote com múltiplos itens (${itensDetalhados.length}). Calculando frete individual para cada item...`);
                         
                         // Usar o novo método para calcular o frete total do pacote
                         const resultadoFretePacote = await this.calcularFreteTotalPacote(
                             itensDetalhados,
                             colunaFreteUsada,
                             is_sulsudeste,
                             is_fulfillment,
                             sellerReputationLevelId,
                             accessToken,
                             shipping_id
                         );
                         
                         if (resultadoFretePacote && resultadoFretePacote.valor > 0) {
                             freteCalculado = resultadoFretePacote.valor;
                             detalhesCalculoMultiplo = resultadoFretePacote.detalhes;
                             statusPack = 'MULTIPLO';
                             console.log(`validarFretePorPacote2025: Frete total calculado para múltiplos itens: R$${freteCalculado}`);
                         } else {
                             console.warn(`validarFretePorPacote2025: Falha ao calcular frete para múltiplos itens. Voltando para método tradicional.`);
                             // Se falhar, cair de volta para o método tradicional
                             statusPack = 'FALLBACK';
                         }
                     }
                     
                     // Se não for pack ou se o cálculo múltiplo falhou, usar método tradicional
                     if (!freteCalculado) {
                         // Calcular o frete com base na coluna selecionada e peso
                         const peso_kg = Number(actual_weight_kg) || 0;
                         const peso_volumetrico_kg = Number(chargeable_weight_kg) / 1000 || 0;
                         
                         // Calcular o peso volumétrico manualmente para garantir precisão
                         let pesoVolumetricoCalculado = 0;
                         // Buscar dimensões do pacote para cálculo mais preciso
                         try {
                             const { DimensaoPacote } = require('../../models');
                             const dimensoesPacote = await DimensaoPacote.findOne({
                                 where: { shipment_id: shipping_id },
                                 attributes: ['width', 'length', 'height'],
                                 raw: true
                             });
                             
                             if (dimensoesPacote && dimensoesPacote.width && dimensoesPacote.length && dimensoesPacote.height) {
                                 pesoVolumetricoCalculado = calcularPesoVolumetricoKg(
                                     dimensoesPacote.length,
                                     dimensoesPacote.width,
                                     dimensoesPacote.height
                                 );
                                 console.log(`validarFretePorPacote2025: Peso volumétrico recalculado: ${pesoVolumetricoCalculado}kg (${dimensoesPacote.length}cm x ${dimensoesPacote.width}cm x ${dimensoesPacote.height}cm)`);
                             }
                         } catch (dimError) {
                             console.warn(`validarFretePorPacote2025: Erro ao buscar dimensões do pacote: ${dimError.message}`);
                         }
                         
                         // Usar o maior valor entre todos os pesos disponíveis
                         const pesoVolumetricoFinal = Math.max(peso_volumetrico_kg, pesoVolumetricoCalculado);
                         const pesoCobravel = Math.max(peso_kg, pesoVolumetricoFinal);
                         
                         console.log(`validarFretePorPacote2025: Comparação de pesos - Real: ${peso_kg}kg, Volumétrico: ${pesoVolumetricoFinal}kg, Escolhido: ${pesoCobravel}kg`);
                         
                         const faixaPeso = await FreteService2025.obterFaixaPeso(pesoCobravel, pesoCobravel);
                         freteCalculado = await FreteService2025.obterValorFrete(faixaPeso, colunaFreteUsada);
                         
                         console.log(`validarFretePorPacote2025: Peso cobrável final: ${pesoCobravel}kg, Faixa: ${faixaPeso}`);
                         console.log(`validarFretePorPacote2025: Frete calculado (método tradicional): R$${freteCalculado}`);
                     }
                     
                     // Comparar com o frete cobrado pela API
                     if (freteCobradoAPI !== null) {
                         console.log(`validarFretePorPacote2025: Frete cobrado API: R$${freteCobradoAPI}`);
                         
                         const diferenca = Number(freteCalculado) - Number(freteCobradoAPI);
                         let statusFinal = 'CORRETO';
                         
                         if (Number(freteCobradoAPI) === 0 && compradorPagou) {
                             statusFinal = 'COMPRADOR_PAGOU';
                             console.log(`validarFretePorPacote2025: Comprador pagou frete, status: ${statusFinal}`);
                         } else if (Math.abs(diferenca) <= 0.5) {
                             statusFinal = 'CORRETO';
                             console.log(`validarFretePorPacote2025: Diferença menor que R$0,50, status: ${statusFinal}`);
                         } else if (diferenca > 0) {
                             statusFinal = 'COBRANDO_MENOS';
                             console.log(`validarFretePorPacote2025: ML está cobrando menos R$${diferenca.toFixed(2)}, status: ${statusFinal}`);
                         } else {
                             statusFinal = 'COBRANDO_MAIS';
                             console.log(`validarFretePorPacote2025: ML está cobrando mais R$${Math.abs(diferenca).toFixed(2)}, status: ${statusFinal}`);
                         }
                         
                         // Preparar dados para salvar
                         const validacaoDados = {
                             shipping_id: shipping_id,
                             venda_id: vendaIdDoPacote,
                             frete_calculado: freteCalculado,
                             frete_cobrado_api: freteCobradoAPI,
                             diferenca: diferenca,
                             status_validacao: statusFinal,
                             coluna_tabela_usada: colunaFreteUsada,
                             is_sulsudeste: is_sulsudeste ? 1 : 0,
                             is_special_category: temCategoriaEspecial ? 1 : 0,
                             is_fulfillment: is_fulfillment ? 1 : 0,
                             is_novo_79: temItemNovo79 ? 1 : 0,
                             is_novo_100: temItemNovo100 ? 1 : 0,
                             is_novo_120: temItemNovo120 ? 1 : 0,
                             is_novo_150: temItemNovo150 ? 1 : 0,
                             is_novo_200: temItemNovo200 ? 1 : 0,
                             quantidade_itens: totalQuantity,
                             item_ids: JSON.stringify(allItemIds),
                             data_venda: dataVenda
                         };
                         
                         // Adicionar informações específicas baseadas no método de cálculo utilizado
                         if (statusPack === 'MULTIPLO' && detalhesCalculoMultiplo) {
                             // Se foi calculado pelo método múltiplo, adicionar tag ao status e salvar detalhes
                             validacaoDados.status_validacao = `${statusFinal}_MULTIPLO`;
                             validacaoDados.mensagem_erro = JSON.stringify(detalhesCalculoMultiplo);
                         } else {
                             // Se foi calculado pelo método tradicional, incluir peso e demais informações
                             const peso_kg = Number(actual_weight_kg) || Number(chargeable_weight_kg) / 1000;
                             const peso_volumetrico_kg = Number(chargeable_weight_kg) / 1000;
                             validacaoDados.peso_kg = peso_kg;
                             validacaoDados.peso_volumetrico_kg = peso_volumetrico_kg;
                             
                             if (statusPack === 'FALLBACK') {
                                 validacaoDados.mensagem_erro = 'Falha ao calcular frete múltiplo, usando método tradicional.';
                             }
                         }
                         
                         // Salvar validação no banco
                         try {
                             // Garantir que o modelo ValidacaoPacote2025 existe
                             const { ValidacaoPacote2025 } = require('../../models');
                             
                             if (!ValidacaoPacote2025) {
                                 throw new Error('Modelo ValidacaoPacote2025 não está definido nos models.');
                             }
                             
                             // Verificar se já existe
                             const validacaoExistente = await ValidacaoPacote2025.findOne({
                                 where: { shipping_id: shipping_id }
                             });
                             
                             if (validacaoExistente) {
                                 await ValidacaoPacote2025.update(validacaoDados, {
                                     where: { shipping_id: shipping_id }
                                 });
                                 console.log(`validarFretePorPacote2025: Validação atualizada para ${shipping_id}`);
                             } else {
                                 await ValidacaoPacote2025.create(validacaoDados);
                                 console.log(`validarFretePorPacote2025: Validação criada para ${shipping_id}`);
                             }
                             
                             console.log(`validarFretePorPacote2025: Validação salva com sucesso para ${shipping_id}`);
                             return {
                                 shipping_id: shipping_id,
                                 status: statusFinal,
                                 frete_calculado: freteCalculado,
                                 frete_cobrado: freteCobradoAPI,
                                 diferenca: diferenca,
                                 coluna_frete: colunaFreteUsada,
                                 versao: '2025'
                             };
                         } catch (dbError) {
                             console.error(`validarFretePorPacote2025: Erro ao salvar validação: ${dbError.message}`);
                             mensagemErro = `Erro ao salvar validação: ${dbError.message}`;
                         }
                     } else {
                         console.warn(`validarFretePorPacote2025: Sem frete cobrado pela API para comparar`);
                         statusFinal = 'SEM_FRETE_API';
                     }
                 }
             }
        } catch (error) {
            console.error(`validarFretePorPacote2025: Erro durante validação: ${error.message}`);
            mensagemErro = error.message;
            statusFinal = 'ERRO';
        }
        
        // Em caso de erro, tentar salvar mesmo assim o que temos
        if (statusFinal.startsWith('ERRO') || mensagemErro) {
            try {
                const { ValidacaoPacote2025 } = require('../../models');
                
                if (!ValidacaoPacote2025) {
                    console.error('validarFretePorPacote2025: Modelo ValidacaoPacote2025 não está disponível para salvar erros.');
                    return {
                        shipping_id: shipping_id,
                        status: statusFinal,
                        mensagem: mensagemErro || 'Modelo ValidacaoPacote2025 não está disponível',
                        versao: '2025'
                    };
                }
                
                const validacaoErro = {
                    shipping_id: shipping_id,
                    venda_id: vendaIdDoPacote,
                    status_validacao: statusFinal,
                    frete_calculado: freteCalculado,
                    frete_cobrado_api: freteCobradoAPI,
                    coluna_tabela_usada: colunaFreteUsada,
                    mensagem_erro: mensagemErro,
                    data_venda: dataVenda
                };
                
                const validacaoExistente = await ValidacaoPacote2025.findOne({
                    where: { shipping_id: shipping_id }
                });
                
                if (validacaoExistente) {
                    await ValidacaoPacote2025.update(validacaoErro, {
                        where: { shipping_id: shipping_id }
                    });
                } else {
                    await ValidacaoPacote2025.create(validacaoErro);
                }
                
                console.log(`validarFretePorPacote2025: Validação de erro salva para ${shipping_id}`);
            } catch (finalError) {
                console.error(`validarFretePorPacote2025: Erro ao salvar validação de erro: ${finalError.message}`);
            }
        }
        
        return {
            shipping_id: shipping_id,
            status: statusFinal,
            frete_calculado: freteCalculado,
            frete_cobrado: freteCobradoAPI,
            mensagem: mensagemErro,
            versao: '2025'
        };
    }
}

module.exports = new ValidacaoFreteService2025();
