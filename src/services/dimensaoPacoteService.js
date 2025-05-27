// src/services/dimensaoPacoteService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadoLivre');
const authService = require('./authService');
const { DimensaoPacote } = require('../../models');

// Função para parsear a string "AxLxC,Peso"
function parseDimensoesString(dimString) {
    if (!dimString || typeof dimString !== 'string') {
        return null;
    }
    try {
        const parts = dimString.split(',');
        if (parts.length !== 2) return null;

        const dims = parts[0].split('x');
        if (dims.length !== 3) return null;

        const height = parseFloat(dims[0]);
        const width = parseFloat(dims[1]);
        const length = parseFloat(dims[2]);
        const weight = parseFloat(parts[1]); // Peso total em gramas

        if (isNaN(height) || isNaN(width) || isNaN(length) || isNaN(weight)) {
            return null;
        }

        return { height, width, length, weight }; // Retorna objeto com peso total em gramas
    } catch (e) {
        console.error(`Erro ao parsear string de dimensões "${dimString}":`, e);
        return null;
    }
}


class DimensaoPacoteService {
    async obterDimensaoPacote(shipmentId, accessToken = null) {
        console.log(`obterDimensaoPacote: Iniciando para shipment_id ${shipmentId}`);
        let parsedDimensions = null; // Objeto com {height, width, length, weight} do PACOTE
        let weightGrams = null;

        try {
            if (!accessToken) {
                accessToken = await authService.getValidToken();
            }

            // *** Buscar no endpoint /shipments/{id} ***
            const shipmentUrl = `${config.api_base_url}/shipments/${shipmentId}`;
            console.log('obterDimensaoPacote: URL da requisição - ', shipmentUrl);

            const response = await fetch(shipmentUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });

            if (!response.ok) {
                // ... (tratamento de erro como antes) ...
                 const errorBody = await response.text();
                console.error(`obterDimensaoPacote: Erro ${response.status} ao buscar envio: ${errorBody}`);
                if (response.status === 401) throw { name: 'TokenError', message: `Token inválido/expirado ${shipmentId}.` };
                throw new Error(`Erro ${response.status} ao obter detalhes do envio ${shipmentId}.`);
            }

            const data = await response.json();

            // *** Extrair e Parsear a string de dimensões do pacote ***
            if (data && Array.isArray(data.shipping_items) && data.shipping_items.length > 0) {
                const dimString = data.shipping_items[0]?.dimensions; // Pega a string "AxLxC,Peso"
                if (dimString) {
                    console.log(`obterDimensaoPacote: String dimensions encontrada: "${dimString}"`);
                    parsedDimensions = parseDimensoesString(dimString); // Usa a função helper
                    if (parsedDimensions) {
                        weightGrams = parsedDimensions.weight; // Guarda peso total em gramas
                        console.log('obterDimensaoPacote: Dimensões parseadas do PACOTE:', parsedDimensions);
                    } else {
                         console.warn(`obterDimensaoPacote: Falha ao parsear string dimensions para ${shipmentId}`);
                    }
                } else {
                     console.warn(`obterDimensaoPacote: Campo shipping_items[0].dimensions não encontrado ou vazio para ${shipmentId}`);
                }
            } else {
                console.warn(`obterDimensaoPacote: Campo shipping_items não encontrado ou inválido para ${shipmentId}`);
            }

            // Salva/Atualiza no banco de dados usando os dados PARSEADOS do PACOTE
            await DimensaoPacote.upsert({
                shipment_id: String(shipmentId),
                height: parsedDimensions?.height ?? null,
                width: parsedDimensions?.width ?? null,
                length: parsedDimensions?.length ?? null,
                weight: weightGrams ?? null // Salva o peso TOTAL em GRAMAS
            });

            console.log(`Dimensões do pacote ${shipmentId} salvas/atualizadas (Peso TOTAL em gramas: ${weightGrams}).`);

            // Retorna o objeto parseado para o serviço chamador
            return parsedDimensions;

        } catch (error) {
            // ... (bloco catch como antes) ...
             console.error(`Erro em obterDimensaoPacote para ${shipmentId}:`, error);
             if (error.name === 'TokenError') throw error;
            try { await DimensaoPacote.upsert({ shipment_id: String(shipmentId), height: null, width: null, length: null, weight: null }); }
            catch (dbError) { console.error(`Erro ao salvar null em DimensaoPacote para ${shipmentId}:`, dbError); }
            throw new Error(`Falha ao obter/salvar dimensões do pacote ${shipmentId}: ${error.message}`);
        } finally {
             console.log(`obterDimensaoPacote: Método finalizado para shipment_id ${shipmentId}`);
        }
    }

    // Função inalterada
    async getDimensaoByVendaId(shipmentId) {
        // ... (código como antes) ...
         console.log(`getDimensaoByVendaId: Buscando dimensões para ${shipmentId}`);
        try {
            const dimensao = await DimensaoPacote.findOne({ where: { shipment_id: String(shipmentId) } });
            if (dimensao) {
                 console.log(`getDimensaoByVendaId: Dimensões encontradas no DB para ${shipmentId}`);
            } else {
                 console.log(`getDimensaoByVendaId: Dimensões NÃO encontradas no DB para ${shipmentId}`);
            }
            return dimensao;
        }
        catch (error) {
            console.error(`Erro em getDimensaoByVendaId para ${shipmentId}:`, error);
            throw error;
        } finally {
             console.log(`getDimensaoByVendaId: Método finalizado para ${shipmentId}`);
        }
    }
}

module.exports = new DimensaoPacoteService();