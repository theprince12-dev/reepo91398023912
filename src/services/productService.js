// src/services/productService.js
const fetch = require('node-fetch').default;
const config = require('../config/mercadolivre');
const authService = require('./authService');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Serviço para gerenciar produtos do Mercado Livre
 * Documentação: 
 * - https://developers.mercadolivre.com.br/pt_br/guia-para-produtos
 * - https://developers.mercadolivre.com.br/pt_br/publicacao-de-produtos
 * - https://developers.mercadolivre.com.br/pt_br/user-products
 */
class ProductService {
    /**
     * Obtém todos os produtos do vendedor
     * @param {number} offset - Offset para paginação
     * @param {number} limit - Limite de itens por página
     * @param {string} status - Status dos produtos (active, paused, closed, etc)
     * @returns {Promise<Object>} - Lista de produtos
     */
    async getAllProducts(offset = 0, limit = 50, status = 'active') {
        try {
            const accessToken = await authService.getValidToken();
            const sellerId = await authService.obterSellerId(accessToken);
            
            const url = `${config.api_base_url}/users/${sellerId}/items/search?offset=${offset}&limit=${limit}&status=${status}`;
            
            console.log(`getAllProducts: Buscando produtos para vendedor ${sellerId} com status ${status}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getAllProducts: Erro ${response.status} ao buscar produtos:`, errorData);
                throw new Error(`Erro ao buscar produtos: ${errorData.message || response.statusText}`);
            }
            
            const searchResult = await response.json();
            
            // Se quisermos obter detalhes completos de cada produto
            if (searchResult.results && searchResult.results.length > 0) {
                const productIds = searchResult.results;
                const products = await Promise.all(
                    productIds.map(productId => this.getProductById(productId))
                );
                
                return {
                    paging: searchResult.paging,
                    products
                };
            }
            
            return searchResult;
        } catch (error) {
            console.error('getAllProducts: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter produtos: ${error.message}`);
        }
    }

    /**
     * Obtém detalhes de um produto específico
     * @param {string} productId - ID do produto
     * @returns {Promise<Object>} - Detalhes do produto
     */
    async getProductById(productId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}`;
            
            console.log(`getProductById: Buscando produto ${productId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`getProductById: Erro ${response.status} ao buscar produto ${productId}:`, errorData);
                throw new Error(`Erro ao buscar produto ${productId}: ${errorData.message || response.statusText}`);
            }
            
            const product = await response.json();
            console.log(`getProductById: Produto ${productId} encontrado`);
            return product;
        } catch (error) {
            console.error(`getProductById: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Cria um novo produto
     * @param {Object} productData - Dados do produto
     * @returns {Promise<Object>} - Produto criado
     */
    async createProduct(productData) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items`;
            
            console.log('createProduct: Criando novo produto');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`createProduct: Erro ${response.status} ao criar produto:`, responseData);
                throw new Error(`Erro ao criar produto: ${responseData.message || response.statusText}`);
            }
            
            console.log(`createProduct: Produto criado com ID ${responseData.id}`);
            return responseData;
        } catch (error) {
            console.error('createProduct: Erro:', error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao criar produto: ${error.message}`);
        }
    }

    /**
     * Atualiza um produto existente
     * @param {string} productId - ID do produto
     * @param {Object} productData - Dados do produto
     * @returns {Promise<Object>} - Produto atualizado
     */
    async updateProduct(productId, productData) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}`;
            
            console.log(`updateProduct: Atualizando produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`updateProduct: Erro ${response.status} ao atualizar produto ${productId}:`, responseData);
                throw new Error(`Erro ao atualizar produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`updateProduct: Produto ${productId} atualizado`);
            return responseData;
        } catch (error) {
            console.error(`updateProduct: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao atualizar produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Exclui um produto (altera o status para "closed")
     * @param {string} productId - ID do produto
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteProduct(productId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}`;
            
            console.log(`deleteProduct: Excluindo produto ${productId}`);
            
            // No Mercado Livre, a exclusão é feita alterando o status para "closed"
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'closed' })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`deleteProduct: Erro ${response.status} ao excluir produto ${productId}:`, responseData);
                throw new Error(`Erro ao excluir produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`deleteProduct: Produto ${productId} excluído (status alterado para closed)`);
            return responseData;
        } catch (error) {
            console.error(`deleteProduct: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao excluir produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Obtém a descrição de um produto
     * @param {string} productId - ID do produto
     * @returns {Promise<Object>} - Descrição do produto
     */
    async getProductDescription(productId) {
        try {
            const accessToken = await authService.getValidToken();
            // De acordo com a API do Mercado Livre, a descrição deve ser obtida com uma URL específica
            const url = `${config.api_base_url}/items/${productId}/description`;
            
            console.log(`getProductDescription: Buscando descrição do produto ${productId}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                // Se falhar devido a erro na API para descrições, vamos tentar uma abordagem alternativa
                console.warn(`getProductDescription: Erro ${response.status} na primeira tentativa, tentando método alternativo para ${productId}`);
                
                // Buscar o produto completo e verificar se há descrição disponível
                try {
                    const product = await this.getProductById(productId);
                    
                    // Criar um objeto de descrição similar ao da API
                    const fallbackDescription = {
                        plain_text: product.description || "Descrição não disponível para este produto.",
                        text: product.description || "Descrição não disponível para este produto.",
                        last_updated: new Date().toISOString()
                    };
                    
                    console.log(`getProductDescription: Usando descrição alternativa para ${productId}`);
                    return fallbackDescription;
                } catch (productError) {
                    console.error(`getProductDescription: Falha também no método alternativo:`, productError);
                    throw new Error(`Erro ao buscar descrição do produto ${productId}: Não foi possível recuperar os dados`);
                }
            }
            
            const description = await response.json();
            console.log(`getProductDescription: Descrição do produto ${productId} encontrada`);
            return description;
        } catch (error) {
            console.error(`getProductDescription: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter descrição do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Atualiza a descrição de um produto
     * @param {string} productId - ID do produto
     * @param {string} description - Nova descrição
     * @returns {Promise<Object>} - Resultado da operação
     */
    async updateProductDescription(productId, description) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}/description`;
            
            console.log(`updateProductDescription: Atualizando descrição do produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ plain_text: description })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`updateProductDescription: Erro ${response.status} ao atualizar descrição do produto ${productId}:`, responseData);
                throw new Error(`Erro ao atualizar descrição do produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`updateProductDescription: Descrição do produto ${productId} atualizada`);
            return responseData;
        } catch (error) {
            console.error(`updateProductDescription: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao atualizar descrição do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Obtém as variações de um produto
     * @param {string} productId - ID do produto
     * @returns {Promise<Array>} - Lista de variações
     */
    async getProductVariations(productId) {
        try {
            const product = await this.getProductById(productId);
            
            if (product && product.variations) {
                console.log(`getProductVariations: ${product.variations.length} variações encontradas para produto ${productId}`);
                return product.variations;
            }
            
            console.log(`getProductVariations: Nenhuma variação encontrada para produto ${productId}`);
            return [];
        } catch (error) {
            console.error(`getProductVariations: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter variações do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Adiciona uma variação a um produto
     * @param {string} productId - ID do produto
     * @param {Object} variationData - Dados da variação
     * @returns {Promise<Object>} - Resultado da operação
     */
    async addProductVariation(productId, variationData) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}/variations`;
            
            console.log(`addProductVariation: Adicionando variação ao produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(variationData)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`addProductVariation: Erro ${response.status} ao adicionar variação ao produto ${productId}:`, responseData);
                throw new Error(`Erro ao adicionar variação ao produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`addProductVariation: Variação adicionada ao produto ${productId}`);
            return responseData;
        } catch (error) {
            console.error(`addProductVariation: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao adicionar variação ao produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Atualiza uma variação de um produto
     * @param {string} productId - ID do produto
     * @param {string} variationId - ID da variação
     * @param {Object} variationData - Dados da variação
     * @returns {Promise<Object>} - Resultado da operação
     */
    async updateProductVariation(productId, variationId, variationData) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}/variations/${variationId}`;
            
            console.log(`updateProductVariation: Atualizando variação ${variationId} do produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(variationData)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`updateProductVariation: Erro ${response.status} ao atualizar variação ${variationId} do produto ${productId}:`, responseData);
                throw new Error(`Erro ao atualizar variação ${variationId} do produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`updateProductVariation: Variação ${variationId} do produto ${productId} atualizada`);
            return responseData;
        } catch (error) {
            console.error(`updateProductVariation: Erro para variação ${variationId} do produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao atualizar variação ${variationId} do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Exclui uma variação de um produto
     * @param {string} productId - ID do produto
     * @param {string} variationId - ID da variação
     * @returns {Promise<boolean>} - Resultado da operação
     */
    async deleteProductVariation(productId, variationId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}/variations/${variationId}`;
            
            console.log(`deleteProductVariation: Excluindo variação ${variationId} do produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`deleteProductVariation: Erro ${response.status} ao excluir variação ${variationId} do produto ${productId}:`, errorData);
                throw new Error(`Erro ao excluir variação ${variationId} do produto ${productId}: ${errorData.message || response.statusText}`);
            }
            
            console.log(`deleteProductVariation: Variação ${variationId} do produto ${productId} excluída`);
            return true;
        } catch (error) {
            console.error(`deleteProductVariation: Erro para variação ${variationId} do produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao excluir variação ${variationId} do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Obtém as imagens de um produto
     * @param {string} productId - ID do produto
     * @returns {Promise<Array>} - Lista de imagens
     */
    async getProductImages(productId) {
        try {
            const product = await this.getProductById(productId);
            
            if (product && product.pictures) {
                console.log(`getProductImages: ${product.pictures.length} imagens encontradas para produto ${productId}`);
                return product.pictures;
            }
            
            console.log(`getProductImages: Nenhuma imagem encontrada para produto ${productId}`);
            return [];
        } catch (error) {
            console.error(`getProductImages: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao obter imagens do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Faz upload de uma imagem para um produto
     * @param {string} productId - ID do produto
     * @param {string} imagePath - Caminho da imagem
     * @returns {Promise<Object>} - Resultado da operação
     */
    async uploadProductImage(productId, imagePath) {
        try {
            const accessToken = await authService.getValidToken();
            
            // Primeiro, fazemos upload da imagem para o servidor do Mercado Livre
            const uploadUrl = `${config.api_base_url}/pictures`;
            const formData = new FormData();
            formData.append('file', fs.createReadStream(imagePath));
            
            console.log(`uploadProductImage: Fazendo upload de imagem para produto ${productId}`);
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });
            
            const uploadData = await uploadResponse.json();
            
            if (!uploadResponse.ok) {
                console.error(`uploadProductImage: Erro ${uploadResponse.status} ao fazer upload da imagem:`, uploadData);
                throw new Error(`Erro ao fazer upload da imagem: ${uploadData.message || uploadResponse.statusText}`);
            }
            
            // Agora, associamos a imagem ao produto
            const product = await this.getProductById(productId);
            const pictures = product.pictures || [];
            pictures.push({ id: uploadData.id });
            
            const updateUrl = `${config.api_base_url}/items/${productId}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pictures })
            });
            
            const updateData = await updateResponse.json();
            
            if (!updateResponse.ok) {
                console.error(`uploadProductImage: Erro ${updateResponse.status} ao associar imagem ao produto ${productId}:`, updateData);
                throw new Error(`Erro ao associar imagem ao produto ${productId}: ${updateData.message || updateResponse.statusText}`);
            }
            
            console.log(`uploadProductImage: Imagem adicionada ao produto ${productId}`);
            return updateData;
        } catch (error) {
            console.error(`uploadProductImage: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao fazer upload de imagem para produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Faz upload de uma imagem por URL para um produto
     * @param {string} productId - ID do produto
     * @param {string} imageUrl - URL da imagem
     * @returns {Promise<Object>} - Resultado da operação
     */
    async uploadProductImageByUrl(productId, imageUrl) {
        try {
            const accessToken = await authService.getValidToken();
            
            // Fazemos upload da imagem por URL
            const uploadUrl = `${config.api_base_url}/pictures`;
            
            console.log(`uploadProductImageByUrl: Fazendo upload de imagem por URL para produto ${productId}`);
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ source: imageUrl })
            });
            
            const uploadData = await uploadResponse.json();
            
            if (!uploadResponse.ok) {
                console.error(`uploadProductImageByUrl: Erro ${uploadResponse.status} ao fazer upload da imagem por URL:`, uploadData);
                throw new Error(`Erro ao fazer upload da imagem por URL: ${uploadData.message || uploadResponse.statusText}`);
            }
            
            // Associamos a imagem ao produto
            const product = await this.getProductById(productId);
            const pictures = product.pictures || [];
            pictures.push({ id: uploadData.id });
            
            const updateUrl = `${config.api_base_url}/items/${productId}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pictures })
            });
            
            const updateData = await updateResponse.json();
            
            if (!updateResponse.ok) {
                console.error(`uploadProductImageByUrl: Erro ${updateResponse.status} ao associar imagem ao produto ${productId}:`, updateData);
                throw new Error(`Erro ao associar imagem ao produto ${productId}: ${updateData.message || updateResponse.statusText}`);
            }
            
            console.log(`uploadProductImageByUrl: Imagem adicionada ao produto ${productId}`);
            return updateData;
        } catch (error) {
            console.error(`uploadProductImageByUrl: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao fazer upload de imagem por URL para produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Exclui uma imagem de um produto
     * @param {string} productId - ID do produto
     * @param {string} imageId - ID da imagem
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteProductImage(productId, imageId) {
        try {
            const accessToken = await authService.getValidToken();
            
            // Obtemos as imagens atuais do produto
            const product = await this.getProductById(productId);
            const pictures = (product.pictures || []).filter(pic => pic.id !== imageId);
            
            console.log(`deleteProductImage: Excluindo imagem ${imageId} do produto ${productId}`);
            
            // Atualizamos o produto com a lista de imagens sem a imagem a ser excluída
            const updateUrl = `${config.api_base_url}/items/${productId}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pictures })
            });
            
            const updateData = await updateResponse.json();
            
            if (!updateResponse.ok) {
                console.error(`deleteProductImage: Erro ${updateResponse.status} ao remover imagem ${imageId} do produto ${productId}:`, updateData);
                throw new Error(`Erro ao remover imagem ${imageId} do produto ${productId}: ${updateData.message || updateResponse.statusText}`);
            }
            
            console.log(`deleteProductImage: Imagem ${imageId} removida do produto ${productId}`);
            return updateData;
        } catch (error) {
            console.error(`deleteProductImage: Erro para imagem ${imageId} do produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao excluir imagem ${imageId} do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Busca produtos no Mercado Livre
     * @param {string} query - Termo de busca
     * @param {Object} filters - Filtros adicionais
     * @param {number} offset - Offset para paginação
     * @param {number} limit - Limite de itens por página
     * @returns {Promise<Object>} - Resultados da busca
     */
    async searchProducts(query, filters = {}, offset = 0, limit = 50) {
        try {
            const accessToken = await authService.getValidToken();
            
            // Construir a URL com os parâmetros de busca
            const searchParams = new URLSearchParams({
                q: query,
                offset: offset,
                limit: limit
            });
            
            // Adicionar filtros adicionais
            Object.entries(filters).forEach(([key, value]) => {
                searchParams.append(key, value);
            });
            
            const url = `${config.api_base_url}/sites/MLB/search?${searchParams.toString()}`;
            
            console.log(`searchProducts: Buscando produtos com termo "${query}"`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`searchProducts: Erro ${response.status} ao buscar produtos:`, errorData);
                throw new Error(`Erro ao buscar produtos: ${errorData.message || response.statusText}`);
            }
            
            const searchResult = await response.json();
            console.log(`searchProducts: ${searchResult.paging.total} produtos encontrados para "${query}"`);
            return searchResult;
        } catch (error) {
            console.error(`searchProducts: Erro ao buscar "${query}":`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao buscar produtos: ${error.message}`);
        }
    }

    /**
     * Republica um produto que foi encerrado
     * @param {string} productId - ID do produto
     * @returns {Promise<Object>} - Resultado da operação
     */
    async republishProduct(productId) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}/relist`;
            
            console.log(`republishProduct: Republicando produto ${productId}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price: null }) // Manter o mesmo preço
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`republishProduct: Erro ${response.status} ao republicar produto ${productId}:`, responseData);
                throw new Error(`Erro ao republicar produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`republishProduct: Produto ${productId} republicado com sucesso`);
            return responseData;
        } catch (error) {
            console.error(`republishProduct: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao republicar produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Atualiza o preço de um produto
     * @param {string} productId - ID do produto
     * @param {number} price - Novo preço
     * @returns {Promise<Object>} - Resultado da operação
     */
    async updateProductPrice(productId, price) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}`;
            
            console.log(`updateProductPrice: Atualizando preço do produto ${productId} para ${price}`);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`updateProductPrice: Erro ${response.status} ao atualizar preço do produto ${productId}:`, responseData);
                throw new Error(`Erro ao atualizar preço do produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`updateProductPrice: Preço do produto ${productId} atualizado para ${price}`);
            return responseData;
        } catch (error) {
            console.error(`updateProductPrice: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao atualizar preço do produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Atualiza o estoque de um produto
     * @param {string} productId - ID do produto
     * @param {number} available_quantity - Nova quantidade disponível
     * @returns {Promise<Object>} - Resultado da operação
     */
    async updateProductStock(productId, available_quantity) {
        try {
            const accessToken = await authService.getValidToken();
            const url = `${config.api_base_url}/items/${productId}`;
            
            console.log(`updateProductStock: Atualizando estoque do produto ${productId} para ${available_quantity}`);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ available_quantity })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                console.error(`updateProductStock: Erro ${response.status} ao atualizar estoque do produto ${productId}:`, responseData);
                throw new Error(`Erro ao atualizar estoque do produto ${productId}: ${responseData.message || response.statusText}`);
            }
            
            console.log(`updateProductStock: Estoque do produto ${productId} atualizado para ${available_quantity}`);
            return responseData;
        } catch (error) {
            console.error(`updateProductStock: Erro para produto ${productId}:`, error);
            if (error.name === 'TokenError') throw error;
            throw new Error(`Falha ao atualizar estoque do produto ${productId}: ${error.message}`);
        }
    }
}

module.exports = new ProductService();
