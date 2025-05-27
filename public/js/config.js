/**
 * Configuration file for the Mercado Livre Product App
 * This file centralizes all environment-specific settings
 */

const AppConfig = {
    // Environment detection
    isProduction: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
    
    // API configuration
    api: {
        // Base URL will automatically use the current domain or localhost:3000
        baseUrl: (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) 
            ? 'http://localhost:3000' 
            : window.location.origin,
        
        // API endpoints
        endpoints: {
            // Authentication endpoints
            auth: {
                url: '/api/auth/url',
                redirect: '/api/auth/redirect',
                callback: '/api/auth/callback',
                test: '/api/auth/test'
            },
            
            // Product endpoints
            products: {
                getProduct: (productId) => `/api/products/${productId}`,
                getAllProducts: '/api/products',
                createProduct: '/api/products',
                updateProduct: (productId) => `/api/products/${productId}`,
                deleteProduct: (productId) => `/api/products/${productId}/delete`,
                getProductDescription: (productId) => `/api/products/${productId}/description`,
                updateProductDescription: (productId) => `/api/products/${productId}/description`,
                getProductVariations: (productId) => `/api/products/${productId}/variations`,
                addProductVariation: (productId) => `/api/products/${productId}/variations`,
                updateProductVariation: (productId, variationId) => `/api/products/${productId}/variations/${variationId}`,
                deleteProductVariation: (productId, variationId) => `/api/products/${productId}/variations/${variationId}`,
                getProductImages: (productId) => `/api/products/${productId}/images`,
                uploadProductImage: (productId) => `/api/products/${productId}/images`,
                deleteProductImage: (productId, imageId) => `/api/products/${productId}/images/${imageId}`,
                searchProducts: '/api/products/search',
                republishProduct: (productId) => `/api/products/${productId}/republish`,
                updateProductPrice: (productId) => `/api/products/${productId}/price`,
                updateProductStock: (productId) => `/api/products/${productId}/stock`
            },
            
            // Sales and shipping endpoints
            sales: {
                getAllSales: '/api/sales', // Fetches sales
                processSaleDetails: (saleId) => `/api/sales/process-details/${saleId}`, // Process details for a single sale
                validateSaleShipping: (shippingId) => `/api/validate-shipping-simplified/${shippingId}`, // Validate shipping using the simplified approach
                validateSaleShippingLegacy: (shippingId) => `/api/sales/validate-shipping/${shippingId}`, // Legacy shipping validation (mantido para compatibilidade)
                batchProcessSalesDetails: '/api/sales/batch-process-details', // Process details for multiple sales
                batchValidateSalesShipping: '/api/validate-shipping-simplified/batch', // Validate shipping for multiple shipments
                batchValidateSalesShippingLegacy: '/api/sales/batch-validate-shipping', // Legacy batch shipping validation
                validateFrete: (vendaId) => `/api/validate-frete/${vendaId}`, // Legacy individual validation
                getShipment: (shipmentId) => `/api/shipments/${shipmentId}`,
                listShipmentItems: (shippingId) => `/api/validate-shipping-simplified/items/${shippingId}` // Listar itens de um pacote
            },
            
            // User and grants endpoints
            users: {
                getUser: (userId) => `/api/users/${userId}`,
                getCurrentUser: '/api/users/me',
                getUserTokens: '/api/users/tokens',
                getActiveUsers: '/api/users/active',
                getInactiveUsers: '/api/users/inactive',
                getSelectedUser: '/api/users/selected',
                setCurrentUser: '/api/users/set-current',
                selectUser: (userId) => `/api/users/${userId}/select`,
                refreshUserToken: (userId) => `/api/users/${userId}/refresh`,  
                getAllGrants: '/api/grants'
            },
            
            // Pricing endpoints
            pricing: {
                getListingPrices: '/api/listing-prices'
            },
            
            // Freight Reports endpoints
            freightReports: {
                getFreightDiscrepancies: '/api/reports/freight/discrepancies',
                getSummaryReport: '/api/reports/freight/summary',
                getShipmentDiscrepancy: (shippingId) => `/api/reports/freight/shipment/${shippingId}`,
                exportReport: '/api/reports/freight/export'
            },
            
            // Modelo 2025 endpoints
            modelo2025: {
                validateShipping: (shippingId) => `/api/2025/freight/validate/${shippingId}`,
                getValidations: '/api/2025/freight/validations',
                getValidationStats: '/api/2025/freight/validations/stats',
                getValidationDetails: (shippingId) => `/api/2025/freight/validations/${shippingId}`,
                getCurrentUser: '/api/2025/users/current'
            }
        }
    },
    
    // UI configuration
    ui: {
        // Asset version for cache busting
        assetVersion: '1.0.0',
        
        // Default date format
        dateFormat: 'DD/MM/YYYY',
        
        // Default currency format
        currencyFormat: {
            style: 'currency',
            currency: 'BRL'
        },
        
        // Default pagination settings
        pagination: {
            itemsPerPage: 10
        }
    },
    
    // Feature flags
    features: {
        enableCache: true,
        enableErrorReporting: true
    }
};

/**
 * Helper function to get the full URL for an API endpoint
 * @param {string} endpoint - The API endpoint path
 * @returns {string} The full URL
 */
AppConfig.getApiUrl = function(endpoint) {
    return `${this.api.baseUrl}${endpoint}`;
};

/**
 * Helper function to get a versioned asset URL
 * @param {string} assetPath - The path to the asset
 * @returns {string} The versioned asset URL
 */
AppConfig.getAssetUrl = function(assetPath) {
    return `${assetPath}?v=${this.ui.assetVersion}`;
};
