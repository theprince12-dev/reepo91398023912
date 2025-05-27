// src/services/freteService.js
console.log(`[${new Date().toISOString()}] freteService.js: Carregando módulo...`);

const { Frete } = require('../../models'); // Importa do index.js na raiz do projeto
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');
const userService = require('./userService');

// Log para verificar se o modelo Frete foi carregado corretamente
if (Frete) {
    console.log(`[${new Date().toISOString()}] freteService.js: Modelo Frete importado via index.js. Verificando rawAttributes...`);
    if (Frete.rawAttributes) {
        console.log(`[${new Date().toISOString()}] freteService.js: Atributos disponíveis no Frete importado:`, Object.keys(Frete.rawAttributes).length, 'atributos encontrados.');
        // Verifica algumas colunas chave que esperamos que existam
        const colunasChave = ['cnss_outros_7899', 'cnor_outros_7899', 'cnor_outros_79', 'cnss_outros_79'];
        const faltantes = colunasChave.filter(col => !Frete.rawAttributes[col]);
        if (faltantes.length === 0) {
           console.log(`[${new Date().toISOString()}] freteService.js: Colunas chave (${colunasChave.join(', ')}) ENCONTRADAS no modelo importado.`);
        } else {
           console.error(`[${new Date().toISOString()}] freteService.js: ERRO! Colunas chave FALTANDO no modelo importado: ${faltantes.join(', ')}`);
        }
    } else {
        console.error(`[${new Date().toISOString()}] freteService.js: ERRO! Modelo Frete importado via index.js é inválido ou não possui rawAttributes!`);
    }
} else {
    console.error(`[${new Date().toISOString()}] freteService.js: ERRO! Falha ao importar Frete de '../../models'! Verificar exports em index.js.`);
}


class FreteService {

    mapearReputacaoParaColuna(level_id) {
        if (!level_id) return 'sem';
        if (level_id === '5_green') return 'verde';
        if (level_id === '4_yellow') return 'amarelo';
        if (level_id === '3_orange') return 'laranja';
        if (level_id === '2_red') return 'vermelho';
        if (level_id === '1_red') return 'vermelho';
        return 'sem';
    }

    async selecionarColunaFrete(detalhesVenda, itemDetalhes, sellerReputationLevelId) {
        console.log('DEBUG selecionarColunaFrete - INÍCIO');
        console.log('DEBUG selecionarColunaFrete - detalhesVenda (dadosParaColuna) recebido:', JSON.stringify(detalhesVenda));
        console.log('DEBUG selecionarColunaFrete - itemDetalhes (price, condition):', { price: itemDetalhes?.price, condition: itemDetalhes?.condition });
        console.log('DEBUG selecionarColunaFrete - sellerReputationLevelId:', sellerReputationLevelId);

        const { is_sulsudeste, is_special_category, is_fulfillment } = detalhesVenda;
        const { price, condition } = itemDetalhes;

        // *** LOGS DETALHADOS PARA is_sulsudeste ***
        console.log(`DEBUG selecionarColunaFrete - Valor de detalhesVenda.is_sulsudeste:`, detalhesVenda.is_sulsudeste);
        console.log(`DEBUG selecionarColunaFrete - Tipo de detalhesVenda.is_sulsudeste:`, typeof detalhesVenda.is_sulsudeste);
        console.log(`DEBUG selecionarColunaFrete - Valor de is_sulsudeste (desestruturado):`, is_sulsudeste);
        console.log(`DEBUG selecionarColunaFrete - Tipo de is_sulsudeste (desestruturado):`, typeof is_sulsudeste);
        console.log(`DEBUG selecionarColunaFrete - Comparação (is_sulsudeste === 1):`, is_sulsudeste === 1);
        console.log(`DEBUG selecionarColunaFrete - Comparação (Number(is_sulsudeste) === 1):`, Number(is_sulsudeste) === 1);

        const prefixo = Number(is_special_category) === 1 ? 'ce' : 'cn'; // Converte para número antes de comparar
        // *** FORÇAR A CONVERSÃO PARA NÚMERO ANTES DA COMPARAÇÃO ***
        const regiao = Number(is_sulsudeste) === 1 ? 'ss' : 'or';
        const tipoLogistico = Number(is_fulfillment) === 1 ? 'full' : 'outros'; // Aplicar o mesmo para is_fulfillment
        const reputacaoColuna = this.mapearReputacaoParaColuna(sellerReputationLevelId);

        console.log(`DEBUG selecionarColunaFrete - Componentes Calculados: prefixo=${prefixo}, regiao=${regiao}, tipoLogistico=${tipoLogistico}, reputacaoColuna=${reputacaoColuna}`);

        let sufixoCondicao = '';
        let colunaFrete = '';

        if (prefixo === 'ce') {
             // Para categorias especiais, a lógica é mais complexa e envolve reputação diretamente no nome
             colunaFrete = `${prefixo}${regiao}_${tipoLogistico}_${reputacaoColuna}`;
             console.log(`DEBUG selecionarColunaFrete - Categoria Especial. colunaFrete (montada): ${colunaFrete}`);
        } else { // prefixo === 'cn' (Categoria Normal)
            if (condition === 'new' && Number(price) >= 79) { // Converte price para número
                 sufixoCondicao = '79';
            } else {
                 sufixoCondicao = '7899';
            }
             colunaFrete = `${prefixo}${regiao}_${tipoLogistico}_${sufixoCondicao}`;
             console.log(`DEBUG selecionarColunaFrete - Categoria Normal. sufixoCondicao: ${sufixoCondicao}, colunaFrete (montada): ${colunaFrete}`);
         }

        console.log('selecionarColunaFrete: Coluna final selecionada:', colunaFrete);

         // DEBUG LOGGING ANTES DA VERIFICAÇÃO CRÍTICA
         if (Frete && Frete.rawAttributes) {
             console.log(`[DEBUG] FreteService: Verificando se modelo Frete TEM o atributo '${colunaFrete}'.`);
             console.log(`[DEBUG] FreteService: Valor de Frete.rawAttributes['${colunaFrete}']:`, Frete.rawAttributes[colunaFrete]);
             if (Frete.rawAttributes[colunaFrete]) {
                 console.log(`[DEBUG] FreteService: '${colunaFrete}' ENCONTRADO em rawAttributes.`);
             } else {
                 console.error(`[DEBUG] FreteService: ERRO - '${colunaFrete}' NÃO ENCONTRADO em rawAttributes! Atributos disponíveis (primeiros 15):`, Object.keys(Frete.rawAttributes).slice(0,15).join(', '));
             }
         } else {
             console.error("[DEBUG] FreteService: ERRO - Objeto Frete ou Frete.rawAttributes não definido antes da verificação!");
         }

        if (!Frete.rawAttributes[colunaFrete]) {
             console.error(`selecionarColunaFrete: A coluna calculada "${colunaFrete}" não existe na DEFINIÇÃO DO MODELO Frete (freteModel.js). Verifique o nome do atributo JS e o 'field' correspondente nesse arquivo.`);
             throw new Error(`Coluna de frete inválida no Modelo: ${colunaFrete}`);
        }
        console.log(`[DEBUG] FreteService: Verificação de '${colunaFrete}' em rawAttributes PASSOU.`);

        return colunaFrete;
    }

    async obterFaixaPeso(pesoRealKg, pesoVolumetricoKg) {
        // Garantir que ambos os valores são números ou zero
        const pesoRealKgNum = Number(pesoRealKg) || 0;
        const pesoVolumetricoKgNum = Number(pesoVolumetricoKg) || 0;
        
        // Usar o maior entre peso real e volumétrico
        const maiorPesoKg = Math.max(pesoRealKgNum, pesoVolumetricoKgNum);
        const maiorPesoGr = maiorPesoKg * 1000;
        
        console.log(`obterFaixaPeso: Peso Real: ${pesoRealKgNum}kg (${Math.round(pesoRealKgNum * 1000)}g)`);
        console.log(`obterFaixaPeso: Peso Volumétrico: ${pesoVolumetricoKgNum}kg (${Math.round(pesoVolumetricoKgNum * 1000)}g)`);
        console.log(`obterFaixaPeso: Maior Peso (usado): ${maiorPesoKg}kg (${maiorPesoGr}g)`);
        
        let faixaPeso;
        if (maiorPesoGr <= 300) faixaPeso = '0-300';
        else if (maiorPesoGr <= 500) faixaPeso = '301-500';
        else if (maiorPesoGr <= 1000) faixaPeso = '501-1000';
        else if (maiorPesoGr <= 2000) faixaPeso = '1001-2000';
        else if (maiorPesoGr <= 3000) faixaPeso = '2001-3000';
        else if (maiorPesoGr <= 4000) faixaPeso = '3001-4000';
        else if (maiorPesoGr <= 5000) faixaPeso = '4001-5000';
        else if (maiorPesoGr <= 9000) faixaPeso = '5001-9000';
        else if (maiorPesoGr <= 13000) faixaPeso = '9001-13000';
        else if (maiorPesoGr <= 17000) faixaPeso = '13001-17000';
        else if (maiorPesoGr <= 23000) faixaPeso = '17001-23000';
        else if (maiorPesoGr <= 30000) faixaPeso = '23001-30000';
        else if (maiorPesoGr <= 40000) faixaPeso = '30001-40000';
        else if (maiorPesoGr <= 50000) faixaPeso = '40001-50000';
        else if (maiorPesoGr <= 60000) faixaPeso = '50001-60000';
        else if (maiorPesoGr <= 70000) faixaPeso = '60001-70000';
        else if (maiorPesoGr <= 80000) faixaPeso = '70001-80000';
        else if (maiorPesoGr <= 90000) faixaPeso = '80001-90000';
        else if (maiorPesoGr <= 100000) faixaPeso = '90001-100000';
        else if (maiorPesoGr <= 125000) faixaPeso = '100001-125000';
        else if (maiorPesoGr <= 150000) faixaPeso = '125001-150000';
        else faixaPeso = '150001-';
        console.log(`obterFaixaPeso: Faixa de peso encontrada: ${faixaPeso}`);
        return faixaPeso;
    }

    async obterValorFrete(faixaPeso, colunaFrete) {
        try {
          console.log(`obterValorFrete: Buscando frete, Faixa: ${faixaPeso}, Coluna: ${colunaFrete}`);
            const freteInstance = await Frete.findOne({
                 where: { faixa_peso: faixaPeso },
                 raw: true
                });

            if (!freteInstance) {
                console.warn(`obterValorFrete: Nenhum registro encontrado para faixa ${faixaPeso}.`);
                return null;
            }

            console.log('obterValorFrete: Registro completo encontrado (raw):', freteInstance);
            const valor = freteInstance[colunaFrete];

            if (valor === undefined) {
                console.error(`obterValorFrete: Coluna "${colunaFrete}" retornou valor 'undefined' do objeto raw. Verificar se o nome do atributo JS ('${colunaFrete}') está na definição do modelo Frete e se o 'field' corresponde à coluna no DB.`);
                console.error('obterValorFrete: Atributos disponíveis no objeto raw:', Object.keys(freteInstance));
                return null;
            }
            if (valor === null) {
                 console.warn(`obterValorFrete: Coluna "${colunaFrete}" possui valor NULL na tabela para faixa ${faixaPeso}.`);
                 return null;
            }

            console.log(`obterValorFrete: Valor encontrado para ${colunaFrete}:`, valor);
            const valorNumerico = Number(valor);
            if (isNaN(valorNumerico)) {
                 console.error(`obterValorFrete: Valor "${valor}" da coluna "${colunaFrete}" não é um número válido.`);
                 return null;
            }
            return valorNumerico;

        } catch (error) {
          console.error('obterValorFrete: Erro ao obter valor do frete:', error);
            return null;
        }
        finally {
             console.log(`obterValorFrete: Método finalizado para Faixa: ${faixaPeso}, Coluna: ${colunaFrete}`);
       }
    }

    async getItemById(item_id, accessToken){
        try {
             console.log('getItemById: Iniciando busca do item', item_id);
             const url = `${config.api_base_url}/items/${item_id}`;
            console.log('getItemById: URL da requisição:', url);

             const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
             });
            if (!response.ok) {
                 console.warn(`getItemById: Requisição retornou erro ${response.status} para o item ${item_id}`);
                return null;
             }
             console.log('getItemById: Resposta da API recebida com status', response.status);
             const data = await response.json();
            console.log('getItemById: Dados obtidos do item', item_id);
             return data;
        }
          catch (error) {
              console.error('getItemById: Erro ao obter item:', error);
             return null;
         }
         finally{
              console.log('getItemById: Finalizando busca do item', item_id);
         }
    }

    async getListingPrices(price, category_id, listing_type_id, accessToken){
          try{
              console.log('getListingPrices: Iniciando busca das taxas de listagem');
              const url = `${config.api_base_url}/sites/MLB/listing_prices?price=${price}&category_id=${category_id}&listing_type_id=${listing_type_id}`;
              console.log('getListingPrices: URL da requisição', url);
              const response = await fetch(url, {
                 headers: { 'Authorization': `Bearer ${accessToken}` } // Passar token se API exigir
              });
                if (!response.ok) {
                     console.error('getListingPrices: Requisicao retornou erro:', response.status);
                    throw new Error(`Erro ao obter taxas de listagem: ${response.statusText}`);
                 }
              console.log('getListingPrices: Resposta da Requisição', response.status);
              const data = await response.json();
             console.log('getListingPrices: Resposta da Requisição', data);
             console.log('getListingPrices: Retornando dados');
               return data;
          }
           catch (error) {
            console.error('getListingPrices: Erro ao obter taxas de listagem:', error);
               throw error;
         }
        finally {
             console.log('getListingPrices: Método finalizado');
        }
    }
}
module.exports = new FreteService();
