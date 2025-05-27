/**
 * API Service for the Mercado Livre Product App
 * This file provides a centralized way to interact with the backend API
 */

class ApiService {
    /**
     * Make a GET request to the API
     * @param {string} endpoint - The API endpoint
     * @param {Object} params - Query parameters (optional)
     * @returns {Promise<Object>} - The response data
     */
    static async get(endpoint, params = {}) {
        try {
            // Add query parameters if provided
            const url = new URL(AppConfig.getApiUrl(endpoint));
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });

            // Make the request
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Handle non-200 responses
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            // Parse and return the response data
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make a POST request to the API
     * @param {string} endpoint - The API endpoint
     * @param {Object} data - The data to send
     * @returns {Promise<Object>} - The response data
     */
    static async post(endpoint, data = {}) {
        try {
            // Make the request
            const response = await fetch(AppConfig.getApiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Handle non-200 responses
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            // Parse and return the response data
            return await response.json();
        } catch (error) {
            console.error(`Error posting to ${endpoint}:`, error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Handle API errors
     * @param {Error} error - The error object
     */
    static handleError(error) {
        // Log the error
        console.error('API Error:', error);

        // Show an error message to the user
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
        }

        // Report the error if enabled
        if (AppConfig.features.enableErrorReporting) {
            // In a real app, you might send this to an error reporting service
            console.log('Error would be reported to monitoring service in production');
        }
    }

    // Authentication API methods
    static async getAuthUrl() {
        return this.get(AppConfig.api.endpoints.auth.url);
    }

    static async testAuth() {
        return this.get(AppConfig.api.endpoints.auth.test);
    }

    // Sales API methods
    static async getAllSales(fromDate, toDate) { // Fetches sales list
        return this.get(AppConfig.api.endpoints.sales.getAllSales, { from: fromDate, to: toDate });
    }

    static async processSaleDetails(saleId) { // Process details for a single sale
        return this.post(AppConfig.api.endpoints.sales.processSaleDetails(saleId));
    }

    static async validateSaleShipping(shippingId) { // Validate shipping for a single shipment using simplified approach
        return this.post(AppConfig.api.endpoints.sales.validateSaleShipping(shippingId));
    }

    static async validateSaleShippingLegacy(shippingId) { // Legacy method (original implementation)
        return this.post(AppConfig.api.endpoints.sales.validateSaleShippingLegacy(shippingId));
    }

    static async batchValidateSalesShipping(shippingIds) { // Validate shipping for multiple shipments using simplified approach
        return this.post(AppConfig.api.endpoints.sales.batchValidateSalesShipping, { shipping_ids: shippingIds });
    }

    static async batchValidateSalesShippingLegacy(shippingIds) { // Legacy batch method (original implementation)
        return this.post(AppConfig.api.endpoints.sales.batchValidateSalesShippingLegacy, { shipping_ids: shippingIds });
    }
    
    static async getShipmentItems(shippingId) { // Get items for a specific shipment with their dimensions
        return this.get(AppConfig.api.endpoints.sales.listShipmentItems(shippingId));
    }

    // Product API methods
    static async getProduct(productId) {
        return this.get(AppConfig.api.endpoints.products.getProduct(productId));
    }
    
    static async getAllProducts(offset = 0, limit = 50, status = 'active') {
        return this.get(AppConfig.api.endpoints.products.getAllProducts, { offset, limit, status });
    }
    
    static async createProduct(productData) {
        return this.post(AppConfig.api.endpoints.products.createProduct, productData);
    }
    
    static async updateProduct(productId, productData) {
        return this.post(AppConfig.api.endpoints.products.updateProduct(productId), productData);
    }
    
    static async deleteProduct(productId) {
        return this.post(AppConfig.api.endpoints.products.deleteProduct(productId));
    }
    
    static async getProductDescription(productId) {
        return this.get(AppConfig.api.endpoints.products.getProductDescription(productId));
    }
    
    static async updateProductDescription(productId, description) {
        return this.post(AppConfig.api.endpoints.products.updateProductDescription(productId), { description });
    }
    
    static async getProductVariations(productId) {
        return this.get(AppConfig.api.endpoints.products.getProductVariations(productId));
    }
    
    static async addProductVariation(productId, variationData) {
        return this.post(AppConfig.api.endpoints.products.addProductVariation(productId), variationData);
    }
    
    static async updateProductVariation(productId, variationId, variationData) {
        return this.post(AppConfig.api.endpoints.products.updateProductVariation(productId, variationId), variationData);
    }
    
    static async deleteProductVariation(productId, variationId) {
        return this.post(AppConfig.api.endpoints.products.deleteProductVariation(productId, variationId));
    }
    
    static async getProductImages(productId) {
        return this.get(AppConfig.api.endpoints.products.getProductImages(productId));
    }
    
    static async uploadProductImageByUrl(productId, imageUrl) {
        return this.post(AppConfig.api.endpoints.products.uploadProductImage(productId), { imageUrl });
    }
    
    static async deleteProductImage(productId, imageId) {
        return this.post(AppConfig.api.endpoints.products.deleteProductImage(productId, imageId));
    }
    
    static async searchProducts(query, filters = {}, offset = 0, limit = 50) {
        return this.get(AppConfig.api.endpoints.products.searchProducts, { 
            q: query, 
            offset, 
            limit,
            ...filters 
        });
    }
    
    static async republishProduct(productId) {
        return this.post(AppConfig.api.endpoints.products.republishProduct(productId));
    }
    
    static async updateProductPrice(productId, price) {
        return this.post(AppConfig.api.endpoints.products.updateProductPrice(productId), { price });
    }
    
    static async updateProductStock(productId, stock) {
        return this.post(AppConfig.api.endpoints.products.updateProductStock(productId), { available_quantity: stock });
    }

    // Shipping API methods
    static async validateFrete(vendaId) {
        return this.get(AppConfig.api.endpoints.sales.validateFrete(vendaId));
    }

    static async getShipment(shipmentId) {
        return this.get(AppConfig.api.endpoints.sales.getShipment(shipmentId));
    }

    // User API methods
    static async getUser(userId) {
        return this.get(AppConfig.api.endpoints.users.getUser(userId));
    }
    
    static async getCurrentUser() {
        return this.get(AppConfig.api.endpoints.users.getCurrentUser);
    }
    
    static async getUserTokens() {
        return this.get(AppConfig.api.endpoints.users.getUserTokens);
    }
    
    static async getActiveUsers() {
        return this.get(AppConfig.api.endpoints.users.getActiveUsers);
    }
    
    static async getInactiveUsers() {
        return this.get(AppConfig.api.endpoints.users.getInactiveUsers);
    }
    
    static async getSelectedUser() {
        return this.get(AppConfig.api.endpoints.users.getSelectedUser);
    }
    
    static async setCurrentUser(userId, accessToken) {
        return this.post(AppConfig.api.endpoints.users.setCurrentUser, {
            user_id: userId,
            access_token: accessToken
        });
    }
    
    static async selectUser(userId) {
        return this.post(AppConfig.api.endpoints.users.selectUser(userId));
    }
    
    static async refreshUserToken(userId) {
        return this.post(AppConfig.api.endpoints.users.refreshUserToken(userId));
    }

    static async getAllGrants() {
        return this.get(AppConfig.api.endpoints.users.getAllGrants);
    }

    // Pricing API methods
    static async getListingPrices(price, categoryId, listingTypeId) {
        return this.get(AppConfig.api.endpoints.pricing.getListingPrices, {
            price,
            category_id: categoryId,
            listing_type_id: listingTypeId
        });
    }
    
    // Freight Reports API methods
    static async getFreightDiscrepancies(fromDate, toDate, status = null, minDifference = 0.1, onlyLoss = true) {
        return this.get(AppConfig.api.endpoints.freightReports.getFreightDiscrepancies, {
            from: fromDate,
            to: toDate,
            status: status,
            min_difference: minDifference,
            only_loss: onlyLoss
        });
    }
    
    static async getFreightSummaryReport(fromDate, toDate, minDifference = 0.1) {
        return this.get(AppConfig.api.endpoints.freightReports.getSummaryReport, {
            from: fromDate,
            to: toDate,
            min_difference: minDifference
        });
    }
    
    static async getShipmentDiscrepancy(shippingId) {
        return this.get(AppConfig.api.endpoints.freightReports.getShipmentDiscrepancy(shippingId));
    }
    
    static async exportFreightReport(fromDate, toDate, format = 'csv', status = null, minDifference = 0.1, onlyLoss = true) {
        // For this one, we return the URL directly instead of fetching it,
        // as we want to trigger a browser download
        const params = new URLSearchParams({
            from: fromDate,
            to: toDate,
            format: format,
            min_difference: minDifference,
            only_loss: onlyLoss
        });
        
        if (status) params.append('status', status);
        
        return `${AppConfig.getApiUrl(AppConfig.api.endpoints.freightReports.exportReport)}?${params.toString()}`;
    }
    
    // Modelo 2025 API methods
    static async validateShipping2025(shippingId, accessToken) {
        return this.post(AppConfig.api.endpoints.modelo2025.validateShipping(shippingId), {
            access_token: accessToken
        });
    }
    
    static async getValidations2025(status = null, limit = 100, offset = 0) {
        return this.get(AppConfig.api.endpoints.modelo2025.getValidations, {
            status: status,
            limit: limit,
            offset: offset
        });
    }
    
    static async getValidationStats2025() {
        return this.get(AppConfig.api.endpoints.modelo2025.getValidationStats);
    }
    
    static async getValidationDetails2025(shippingId) {
        return this.get(AppConfig.api.endpoints.modelo2025.getValidationDetails(shippingId));
    }
    
    static async getCurrentUser2025(accessToken) {
        return this.post(AppConfig.api.endpoints.modelo2025.getCurrentUser, {
            access_token: accessToken
        });
    }
}
