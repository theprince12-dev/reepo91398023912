// src/services/detalhesVendaService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const DimensaoPacoteService = require('./dimensaoPacoteService'); // Importa o serviço de dimensões
const { DetalhesVenda } = require('../../models'); // Importa o modelo DetalhesVenda do index
const specialCategoryService = require('./specialCategoryService'); // Importa o serviço de categoria especial
const FreteService = require('./freteService'); // Importa para obter detalhes do item

// Função helper para calcular peso volumétrico em KG a partir de CM
function calcularPesoVolumetricoKg(lengthCm, widthCm, heightCm) {
    if (lengthCm && widthCm && heightCm && !isNaN(Number(lengthCm)) && !isNaN(Number(widthCm)) && !isNaN(Number(heightCm))) {
        // Usando divisor 6000 para cm -> kg
        return Number(((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / 6000).toFixed(4));
    }
    console.warn(`calcularPesoVolumetricoKg: Dimensões inválidas recebidas: L=${lengthCm}, W=${widthCm}, H=${heightCm}`);
    return null;
}

class DetalhesVendaService {

    async obterDetalhesVenda(venda_id, accessToken) {
        console.log(`obterDetalhesVenda: Início para venda_id ${venda_id}`);
        try {
            const sellerId = await authService.obterSellerId(accessToken);
            if (!sellerId) {
                throw new Error("Não foi possível obter o seller id.");
            }

            const url = `${config.api_base_url}/orders/search?seller=${sellerId}&ids=${venda_id}`;
            console.log(`obterDetalhesVenda: Buscando venda na URL: ${url}`);

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`obterDetalhesVenda: Erro ${response.status} ao buscar detalhes da venda: ${errorBody}`);
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado ao buscar venda ${venda_id}.` };
                throw new Error(`Erro ${response.status} ao obter detalhes da venda ${venda_id}.`);
            }

            const data = await response.json();
            const vendas = data.results || [];
            if (vendas.length === 0) {
                console.log(`obterDetalhesVenda: Nenhuma venda encontrada para ID ${venda_id}.`);
                return [];
            }
            console.log(`obterDetalhesVenda: Venda ${venda_id} encontrada.`);

            const todosDetalhes = [];
            for (const venda of vendas) {
                let detalhesDoPedido;
                if (!venda?.shipping?.id) {
                    console.log(`obterDetalhesVenda: Venda ${venda.id} não possui shipping_id. Processando sem envio.`);
                    detalhesDoPedido = await this.processarVendaSemShipping(venda, accessToken);
                } else {
                    console.log(`obterDetalhesVenda: Venda ${venda.id} possui shipping_id ${venda.shipping.id}. Processando com envio.`);
                    detalhesDoPedido = await this.processarVendaComShipping(venda, accessToken);
                }
                // Garante que detalhesDoPedido é um array antes de espalhar
                if (Array.isArray(detalhesDoPedido)) {
                    todosDetalhes.push(...detalhesDoPedido);
                } else if (detalhesDoPedido) {
                    // Se retornar um único objeto (improvável pelas funções atuais, mas por segurança)
                    todosDetalhes.push(detalhesDoPedido);
                }
            }

            console.log(`obterDetalhesVenda: Total de ${todosDetalhes.length} detalhes de itens processados para venda ${venda_id}.`);
            return todosDetalhes;

        } catch (error) {
            console.error(`obterDetalhesVenda: Erro GERAL ao obter detalhes da venda ${venda_id}:`, error.message);
            if (error.name === 'TokenError') throw error;
            // Lançar um erro mais genérico para o controller tratar
            throw new Error(`Falha em obterDetalhesVenda para ${venda_id}: ${error.message}`);
        } finally {
            console.log(`obterDetalhesVenda: Método finalizado para venda_id ${venda_id}.`);
        }
    }

    async processarVendaSemShipping(venda, accessToken) {
        console.log(`processarVendaSemShipping: Iniciando para venda ${venda.id}`);
        const detalhes = [];
        const { id, order_items, date_created, buyer, status, total_amount, currency_id, payments } = venda;

        for (const item of order_items) {
            let category_id = null;
            try {
                category_id = await this.obterCategoriaProduto(item.item.id, accessToken);
            } catch (error) {
                // Logar erro mas continuar
                console.error(`processarVendaSemShipping: Erro ao obter categoria do produto ${item.item.id} para venda ${id}:`, error.message);
            }

            let is_special_category = 0; // Default para 0
            if (category_id) {
                try {
                    is_special_category = await specialCategoryService.isSpecialCategory(category_id);
                } catch (error) {
                     console.error(`processarVendaSemShipping: Erro ao verificar categoria especial ${category_id}:`, error.message);
                }
            }

            detalhes.push({
                venda_id: String(id),
                order_item_id: item.item.id,
                date_created: date_created,
                total_amount: total_amount,
                currency_id: currency_id,
                buyer_id: buyer?.id,
                buyer_nickname: buyer?.nickname,
                status: status,
                shipping_cost: payments?.[0]?.shipping_cost ?? 0,
                shipping_id: null,
                height: null,
                width: null,
                length: null,
                weight: null, // Peso real (KG)
                // volumetric_weight: null, // Campo não existe no DB
                chargeable_weight: null, // Peso cobrável (KG)
                volume: null, // Campo 'volume' no DB armazena peso cobrável
                senders_cost: null,
                category_id: category_id,
                is_special_category: is_special_category, // Já será 1 ou 0
                logistic_type: null,
                is_fulfillment: null,
                pack_id: null,
                is_pack: null,
                receiver_state: null,
                is_sulsudeste: null,
            });
        }
        console.log(`processarVendaSemShipping: Detalhes processados para venda ${venda.id}: ${detalhes.length} itens`);
        return detalhes;
    }

    async processarVendaComShipping(venda, accessToken) {
        console.log(`processarVendaComShipping: Iniciando para venda ${venda.id}, shipping_id ${venda.shipping?.id}`);
        let pacoteDimensions = null; // Objeto retornado pelo serviço de dimensões
        let senders_cost = null;
        let logistic_type = null;
        let is_fulfillment = null;
        let pack_id = null;
        let is_pack = null;
        let sender_state = null;
        let is_sulsudeste = null;
        let actual_weight_kg = null;
        let volumetric_weight_kg = null;
        let chargeable_weight_kg = null;
        const shipping_id = venda.shipping?.id;

        if (!shipping_id) {
             console.warn(`processarVendaComShipping: Shipping ID não encontrado para venda ${venda.id}, tratando como sem envio.`);
             return this.processarVendaSemShipping(venda, accessToken);
        }

        try {
            const [shippingData, orderData, shipmentOriginData, shipmentCosts, dimensionsResult] = await Promise.all([
                this.obterDadosEnvio(shipping_id, accessToken),
                this.obterDadosPedido(venda.id, accessToken),
                this.obterDadosShipment(shipping_id, accessToken),
                this.obterCustosEnvio(shipping_id, accessToken),
                DimensaoPacoteService.obterDimensaoPacote(shipping_id, accessToken) // Chama o serviço CORRIGIDO
            ]);

            logistic_type = shippingData?.logistic_type;
            is_fulfillment = shippingData?.is_fulfillment ? 1 : 0;
            pack_id = orderData?.pack_id ? String(orderData.pack_id) : null;
            is_pack = pack_id ? 1 : 0;
            sender_state = shipmentOriginData?.sender_state;
            is_sulsudeste = shipmentOriginData?.is_sulsudeste ? 1 : 0;
            senders_cost = shipmentCosts?.senders?.[0]?.cost ?? null;
            pacoteDimensions = dimensionsResult; // Guarda o objeto retornado {height, width, length, weight_grams}

            console.log(`processarVendaComShipping: Dados agregados para ${shipping_id}:`, { logistic_type, is_fulfillment, pack_id, is_pack, sender_state, is_sulsudeste, senders_cost });
            console.log(`processarVendaComShipping: Objeto dimensions do PACOTE retornado (peso em GRAMAS):`, pacoteDimensions);

             // *** CÁLCULO DOS PESOS COM CONVERSÃO ***
            if (pacoteDimensions && pacoteDimensions.height && pacoteDimensions.width && pacoteDimensions.length) {
                  // Converte peso de GRAMAS (vindo de pacoteDimensions.weight) para KG
                 actual_weight_kg = pacoteDimensions.weight !== null && !isNaN(Number(pacoteDimensions.weight)) ? Number((Number(pacoteDimensions.weight) / 1000).toFixed(4)) : null;
                 // Calcula volumétrico usando dimensões do pacote
                 volumetric_weight_kg = calcularPesoVolumetricoKg(pacoteDimensions.length, pacoteDimensions.width, pacoteDimensions.height);
                 // Calcula peso cobrável usando os valores em KG
                 chargeable_weight_kg = Math.max(actual_weight_kg || 0, volumetric_weight_kg || 0);
                 console.log('processarVendaComShipping: Pesos calculados (kg)', { actual_weight_kg, volumetric_weight_kg, chargeable_weight_kg });
             } else {
                  console.warn(`processarVendaComShipping: Dimensões do pacote inválidas ou não encontradas para ${shipping_id}. Peso cobrável será nulo.`);
                  // Mantém pesos como nulos
                  actual_weight_kg = null;
                  volumetric_weight_kg = null;
                  chargeable_weight_kg = null;
             }

        } catch (error) {
            console.error(`processarVendaComShipping: Erro ao obter dados agregados para ${shipping_id}:`, error.message);
             if (error.name === 'TokenError') throw error;
        }

        // Processa os itens do pedido
        const detalhes = [];
        const { id, order_items, date_created, buyer, status, total_amount, currency_id, payments } = venda;
        if (order_items && Array.isArray(order_items)) {
            for (const item of order_items) {
                let category_id = null;
                try {
                    category_id = await this.obterCategoriaProduto(item.item.id, accessToken);
                } catch (error) {
                    console.error(`processarVendaComShipping: Erro ao obter categoria do produto ${item.item.id}:`, error.message);
                }

                let is_special_category = 0;
                if (category_id) {
                    try {
                       is_special_category = await specialCategoryService.isSpecialCategory(category_id);
                    } catch(error) {
                         console.error(`processarVendaComShipping: Erro ao verificar cat especial ${category_id}:`, error.message);
                    }
                }

                detalhes.push({
                    venda_id: String(id),
                    order_item_id: item.item.id,
                    date_created: date_created,
                    total_amount: total_amount,
                    currency_id: currency_id,
                    buyer_id: buyer?.id,
                    buyer_nickname: buyer?.nickname,
                    status: status,
                    shipping_cost: payments?.[0]?.shipping_cost ?? 0,
                    shipping_id: String(shipping_id), // Garante que é string
                    height: pacoteDimensions?.height ?? null, // Dimensões do pacote
                    width: pacoteDimensions?.width ?? null,
                    length: pacoteDimensions?.length ?? null,
                    weight: actual_weight_kg,           // Peso real em KG
                    chargeable_weight: chargeable_weight_kg, // Peso cobrável em KG
                    volume: chargeable_weight_kg, // *** Campo 'volume' no DB armazena peso cobrável ***
                    senders_cost: senders_cost,
                    category_id: category_id,
                    is_special_category: is_special_category, // 1 ou 0
                    logistic_type: logistic_type,
                    is_fulfillment: is_fulfillment,
                    pack_id: pack_id,
                    is_pack: is_pack,
                    receiver_state: sender_state, // Guarda estado do vendedor aqui
                    is_sulsudeste: is_sulsudeste, // Flag baseado no vendedor
                });
            }
        } else {
             console.warn(`processarVendaComShipping: Venda ${id} sem order_items.`);
        }

        console.log(`processarVendaComShipping: ${detalhes.length} itens processados para ${venda.id}.`);
        return detalhes;
    }

    async obterDadosPedido(venda_id, accessToken) {
        try {
            const url = `${config.api_base_url}/orders/${venda_id}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
             if (!response.ok) {
                  console.warn(`obterDadosPedido: erro ${response.status} para venda ${venda_id}`);
                  if (response.status === 401) throw { name: 'TokenError', message: 'Token inválido/expirado em obterDadosPedido.' };
                  return null;
                }
            const data = await response.json();
            return { pack_id: data?.pack_id ?? null };
        } catch (error) {
            console.error('obterDadosPedido: Erro:', error.message);
           if (error.name === 'TokenError') throw error;
           return null;
        }
    }

    async obterDadosShipment(shipping_id, accessToken) {
         console.log(`obterDadosShipment: Buscando ORIGEM para ${shipping_id}`);
        try {
                const url = `${config.api_base_url}/shipments/${shipping_id}`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                 if (!response.ok) {
                    console.warn(`obterDadosShipment: erro ${response.status} para ${shipping_id}`);
                    if (response.status === 401) throw { name: 'TokenError', message: 'Token inválido/expirado em obterDadosShipment.' };
                  return null;
                }
                const data = await response.json();
                const sender_state = data?.sender_address?.state?.name ?? null;
                if (!sender_state) { console.warn(`obterDadosShipment: sender_state não encontrado para ${shipping_id}`); }
                const sulsudeste_states = ["Paraná", "Rio Grande do Sul", "Rio de Janeiro", "Santa Catarina", "São Paulo", "Minas Gerais", "Espírito Santo"];
                const is_sulsudeste = sender_state ? sulsudeste_states.includes(sender_state) : false;
                console.log(`obterDadosShipment: ${shipping_id} - Estado Remetente: ${sender_state}, É Sul/Sudeste: ${is_sulsudeste}`);
                return {sender_state, is_sulsudeste};
        } catch (error) {
            console.error(`obterDadosShipment: Erro para ${shipping_id}:`, error.message);
            if (error.name === 'TokenError') throw error;
            return null;
        } finally {
            // console.log(`obterDadosShipment: Finalizado para ${shipping_id}`);
        }
    }

    async obterDadosEnvio(shipping_id, accessToken) {
        try {
            const url = `${config.api_base_url}/shipments/${shipping_id}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
             if (!response.ok) {
                  console.warn(`obterDadosEnvio: erro ${response.status} para ${shipping_id}`);
                  if (response.status === 401) throw { name: 'TokenError', message: 'Token inválido/expirado em obterDadosEnvio.' };
                  return null;
                }
            const data = await response.json();
            const logistic_type = data?.logistic_type ?? null;
            const is_fulfillment = logistic_type === 'fulfillment';
           return {logistic_type, is_fulfillment};
        } catch (error) {
            console.error(`obterDadosEnvio: Erro para ${shipping_id}:`, error.message);
            if (error.name === 'TokenError') throw error;
          return null;
        }
    }

    async salvarDetalhesVenda(detalhes) {
        console.log(`salvarDetalhesVenda: Iniciando salvamento para ${detalhes.length} registros.`);
        if (!Array.isArray(detalhes) || detalhes.length === 0) {
            console.log('salvarDetalhesVenda: Nenhum detalhe para salvar.');
            return;
        }
        const sequelizeInstance = DetalhesVenda.sequelize;
         if (!sequelizeInstance) {
             console.error("salvarDetalhesVenda: ERRO FATAL - Instância Sequelize não encontrada no modelo DetalhesVenda!");
             throw new Error("Instância Sequelize não disponível para iniciar transação.");
        }
        const transaction = await sequelizeInstance.transaction();
        try {
            for (const detalhe of detalhes) {
                const dataToSave = {
                    venda_id: detalhe.venda_id,
                    order_item_id: detalhe.order_item_id,
                    date_created: detalhe.date_created,
                    total_amount: detalhe.total_amount,
                    currency_id: detalhe.currency_id,
                    buyer_id: detalhe.buyer_id,
                    buyer_nickname: detalhe.buyer_nickname,
                    status: detalhe.status,
                    shipping_cost: detalhe.shipping_cost,
                    shipping_id: detalhe.shipping_id,
                    height: detalhe.height,
                    width: detalhe.width,
                    length: detalhe.length,
                    weight: detalhe.weight, // Peso real (KG)
                    volume: detalhe.chargeable_weight, // Peso COBRÁVEL (KG)
                    senders_cost: detalhe.senders_cost,
                    category_id: detalhe.category_id,
                    is_special_category: detalhe.is_special_category,
                    logistic_type: detalhe.logistic_type,
                    is_fulfillment: detalhe.is_fulfillment,
                    pack_id: detalhe.pack_id,
                    is_pack: detalhe.is_pack,
                    receiver_state: detalhe.receiver_state, // Estado do vendedor
                    is_sulsudeste: detalhe.is_sulsudeste, // Flag do vendedor
                };
                // console.log("DEBUG: Dados a salvar em DetalhesVendas:", dataToSave);
                await DetalhesVenda.upsert(dataToSave, { transaction: transaction });
            }
            await transaction.commit();
            console.log('salvarDetalhesVenda: Detalhes salvos/atualizados com sucesso via transação.');
        } catch (error) {
            await transaction.rollback();
            console.error('salvarDetalhesVenda: Erro ao salvar detalhes (transação revertida):', error);
            throw error;
        } finally {
            console.log('salvarDetalhesVenda: Método finalizado.');
        }
    }

    async obterCustosEnvio(shipping_id, accessToken){
        try {
            const url = `${config.api_base_url}/shipments/${shipping_id}/costs`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) {
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado em obterCustosEnvio para ${shipping_id}.` };
                console.warn(`obterCustosEnvio: Erro ${response.status} para ${shipping_id}. Retornando null.`);
                return null;
            }
            const data = await response.json();
            return data;
        } catch(error){
            console.error(`obterCustosEnvio: Erro para ${shipping_id}:`, error.message);
            if (error.name === 'TokenError') throw error;
           return null;
       }
    }
   async obterCategoriaProduto(item_id, accessToken){
        try {
            const url = `${config.api_base_url}/items/${item_id}`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) {
                console.warn(`obterCategoriaProduto: erro ${response.status} para item ${item_id}`);
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado em obterCategoriaProduto para ${item_id}.` };
                return null;
            }
            const data = await response.json();
            return data?.category_id ?? null;
        } catch(error){
            console.error(`obterCategoriaProduto: Erro para item ${item_id}:`, error.message);
            if (error.name === 'TokenError') throw error;
            return null;
        }
    }

    // Função mantida, mas não usada pela lógica de validação por pacote
    // async atualizarFreteValidado(venda_id, order_item_id, frete_validado, coluna_usada) { ... }

} // Fim da classe

module.exports = new DetalhesVendaService();