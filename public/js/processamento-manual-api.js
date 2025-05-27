/**
 * API para processamento manual de vendas
 * Este módulo fornece funções para interagir com a API de processamento
 * manual de vendas do backend
 */

class ProcessamentoManualAPI {
    /**
     * Verifica se uma venda existe e está disponível para processamento
     * @param {string} orderId - ID da venda a ser verificada
     * @returns {Promise<Object>} - Promessa resolvida com os dados da verificação
     */
    static async verificarVenda(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/check/${orderId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao verificar venda');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar venda:', error);
            throw error;
        }
    }

    /**
     * Obtém os dados básicos da venda (Etapa 1)
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com os dados da venda
     */
    static async obterDadosVenda(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/data`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao obter dados da venda');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter dados da venda:', error);
            throw error;
        }
    }

    /**
     * Obtém os itens da venda (Etapa 2)
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com os itens da venda
     */
    static async obterItensVenda(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/items`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao obter itens da venda');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter itens da venda:', error);
            throw error;
        }
    }

    /**
     * Processa os dados de envio (Etapa 3)
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com os dados de envio processados
     */
    static async processarDadosEnvio(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/shipping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao processar dados de envio');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao processar dados de envio:', error);
            throw error;
        }
    }

    /**
     * Valida o frete da venda (Etapa 4)
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com os resultados da validação de frete
     */
    static async validarFrete(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao validar frete');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao validar frete:', error);
            throw error;
        }
    }

    /**
     * Finaliza o processamento e salva os dados (Etapa 5)
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com o resultado da finalização
     */
    static async finalizarProcessamento(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/finalize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao finalizar processamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao finalizar processamento:', error);
            throw error;
        }
    }

    /**
     * Executa todos os passos do processamento de uma vez
     * @param {string} orderId - ID da venda a ser processada
     * @returns {Promise<Object>} - Promessa resolvida com os resultados de todos os passos
     */
    static async executarTodosPassos(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/execute-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao executar todos os passos');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao executar todos os passos:', error);
            throw error;
        }
    }

    /**
     * Limpa os dados de processamento de uma venda
     * @param {string} orderId - ID da venda a ser limpa
     * @returns {Promise<Object>} - Promessa resolvida com a confirmação da limpeza
     */
    static async limparDadosProcessamento(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/processing/manual/${orderId}/clear`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao limpar dados de processamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao limpar dados de processamento:', error);
            throw error;
        }
    }
}
