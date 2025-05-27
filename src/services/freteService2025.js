// src/services/freteService2025.js
console.log(`[${new Date().toISOString()}] freteService2025.js: Carregando módulo...`);

const { Frete2025 } = require('../../models'); 
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');

class FreteService2025 {

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
        console.log('DEBUG selecionarColunaFrete2025 - INÍCIO');
        console.log('DEBUG selecionarColunaFrete2025 - detalhesVenda (dadosParaColuna) recebido:', JSON.stringify(detalhesVenda));
        console.log('DEBUG selecionarColunaFrete2025 - itemDetalhes (price, condition):', { price: itemDetalhes?.price, condition: itemDetalhes?.condition });
        console.log('DEBUG selecionarColunaFrete2025 - sellerReputationLevelId:', sellerReputationLevelId);

        const { is_sulsudeste, is_special_category, is_fulfillment } = detalhesVenda;
        const { price, condition } = itemDetalhes;

        const prefixo = Number(is_special_category) === 1 ? 'ce' : 'cn';
        const regiao = Number(is_sulsudeste) === 1 ? 'ss' : 'or';
        const tipoLogistico = Number(is_fulfillment) === 1 ? 'full' : 'outros';
        const reputacaoColuna = this.mapearReputacaoParaColuna(sellerReputationLevelId);

        console.log(`DEBUG selecionarColunaFrete2025 - Componentes Calculados: prefixo=${prefixo}, regiao=${regiao}, tipoLogistico=${tipoLogistico}, reputacaoColuna=${reputacaoColuna}`);

        let sufixoCondicao = '';
        let colunaFrete = '';

        if (prefixo === 'ce') {
             // Para categorias especiais, a lógica é mais complexa e envolve reputação diretamente no nome
             colunaFrete = `${prefixo}${regiao}_${tipoLogistico}_${reputacaoColuna}`;
             console.log(`DEBUG selecionarColunaFrete2025 - Categoria Especial. colunaFrete (montada): ${colunaFrete}`);
        } else { // prefixo === 'cn' (Categoria Normal)
            const itemPrice = Number(price) || 0;
            
            // Lógica atualizada para 2025 com mais faixas de preço
            if (condition === 'used' || itemPrice < 79) {
                sufixoCondicao = '7899';
            } else if (itemPrice >= 79 && itemPrice < 100) {
                sufixoCondicao = '79';
            } else if (itemPrice >= 100 && itemPrice < 120) {
                sufixoCondicao = '100';
            } else if (itemPrice >= 120 && itemPrice < 150) {
                sufixoCondicao = '120';
            } else if (itemPrice >= 150 && itemPrice < 200) {
                sufixoCondicao = '150';
            } else {
                sufixoCondicao = '200';
            }
             
            colunaFrete = `${prefixo}${regiao}_${tipoLogistico}_${sufixoCondicao}`;
            console.log(`DEBUG selecionarColunaFrete2025 - Categoria Normal. Preço: ${itemPrice}, sufixoCondicao: ${sufixoCondicao}, colunaFrete (montada): ${colunaFrete}`);
        }

        console.log('selecionarColunaFrete2025: Coluna final selecionada:', colunaFrete);

        if (!Frete2025 || !Frete2025.rawAttributes) {
            console.error("[DEBUG] FreteService2025: ERRO - Modelo Frete2025 não está carregado corretamente!");
            throw new Error("Modelo Frete2025 não está carregado. Verifique se foi adicionado ao index.js dos models.");
        }

        if (!Frete2025.rawAttributes[colunaFrete]) {
            console.error(`selecionarColunaFrete2025: A coluna calculada "${colunaFrete}" não existe na DEFINIÇÃO DO MODELO Frete2025.`);
            throw new Error(`Coluna de frete inválida no Modelo 2025: ${colunaFrete}`);
        }
        
        console.log(`[DEBUG] FreteService2025: Verificação de '${colunaFrete}' em rawAttributes PASSOU.`);
        
        return colunaFrete;
    }

    async obterFaixaPeso(pesoRealKg, pesoVolumetricoKg) {
        // Garantir que ambos os valores são números ou zero
        const pesoRealKgNum = Number(pesoRealKg) || 0;
        const pesoVolumetricoKgNum = Number(pesoVolumetricoKg) || 0;
        
        // Usar o maior entre peso real e volumétrico
        const maiorPesoKg = Math.max(pesoRealKgNum, pesoVolumetricoKgNum);
        const maiorPesoGr = maiorPesoKg * 1000;
        
        console.log(`obterFaixaPeso2025: Peso Real: ${pesoRealKgNum}kg (${Math.round(pesoRealKgNum * 1000)}g)`);
        console.log(`obterFaixaPeso2025: Peso Volumétrico: ${pesoVolumetricoKgNum}kg (${Math.round(pesoVolumetricoKgNum * 1000)}g)`);
        console.log(`obterFaixaPeso2025: Maior Peso (usado): ${maiorPesoKg}kg (${maiorPesoGr}g)`);
        
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
        console.log(`obterFaixaPeso2025: Faixa de peso encontrada: ${faixaPeso}`);
        return faixaPeso;
    }

    async obterValorFrete(faixaPeso, colunaFrete) {
        try {
            console.log(`obterValorFrete2025: Buscando frete, Faixa: ${faixaPeso}, Coluna: ${colunaFrete}`);
            const freteInstance = await Frete2025.findOne({
                 where: { faixa_peso: faixaPeso },
                 raw: true
            });

            if (!freteInstance) {
                console.warn(`obterValorFrete2025: Nenhum registro encontrado para faixa ${faixaPeso}.`);
                return null;
            }

            console.log('obterValorFrete2025: Registro completo encontrado (raw):', freteInstance);
            const valor = freteInstance[colunaFrete];

            if (valor === undefined) {
                console.error(`obterValorFrete2025: Coluna "${colunaFrete}" retornou valor 'undefined' do objeto raw.`);
                console.error('obterValorFrete2025: Atributos disponíveis no objeto raw:', Object.keys(freteInstance));
                return null;
            }
            
            if (valor === null) {
                 console.warn(`obterValorFrete2025: Coluna "${colunaFrete}" possui valor NULL na tabela para faixa ${faixaPeso}.`);
                 return null;
            }

            console.log(`obterValorFrete2025: Valor encontrado para ${colunaFrete}:`, valor);
            const valorNumerico = Number(valor);
            if (isNaN(valorNumerico)) {
                 console.error(`obterValorFrete2025: Valor "${valor}" da coluna "${colunaFrete}" não é um número válido.`);
                 return null;
            }
            return valorNumerico;

        } catch (error) {
            console.error('obterValorFrete2025: Erro ao obter valor do frete:', error);
            return null;
        }
        finally {
             console.log(`obterValorFrete2025: Método finalizado para Faixa: ${faixaPeso}, Coluna: ${colunaFrete}`);
       }
    }
}

module.exports = new FreteService2025();
