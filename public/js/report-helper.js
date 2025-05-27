/**
 * Helper functions for freight report page
 * Version: 1.0.0 (2025-05-14)
 */

// Show error alert with message
function showError(message, containerId = 'error-message') {
    const errorElement = document.getElementById(containerId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Log to console for debugging
        console.error(`[Report Error] ${message}`);
        
        // Scroll to error message
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Hide error alert
function hideError(containerId = 'error-message') {
    const errorElement = document.getElementById(containerId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Show loading spinner
function showLoading(containerId = 'loading-container') {
    const loadingElement = document.getElementById(containerId);
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

// Hide loading spinner
function hideLoading(containerId = 'loading-container') {
    const loadingElement = document.getElementById(containerId);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Format currency value to R$ format
function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

// Get current filter values from form
function getFilterValues() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    const status = document.getElementById('status-filter')?.value || '';
    const minDifference = document.getElementById('min-difference')?.value || '0.01';
    const onlyLoss = document.getElementById('only-loss')?.value || 'true';
    
    return { fromDate, toDate, status, minDifference, onlyLoss };
}

// Build query params for API calls
function buildQueryParams() {
    const { fromDate, toDate, status, minDifference, onlyLoss } = getFilterValues();
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('from', `${fromDate}T00:00:00.000Z`);
    params.append('to', `${toDate}T23:59:59.999Z`);
    if (status) params.append('status', status);
    params.append('min_difference', minDifference);
    params.append('only_loss', onlyLoss);
    
    return params;
}

// Safely fetch JSON from API with error handling
async function fetchApiJson(endpoint, params) {
    try {
        showLoading();
        hideError();
        
        const response = await fetch(`${endpoint}?${params.toString()}`);
        
        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.message || 
                `Erro na requisição: ${response.status} ${response.statusText}`
            );
        }
        
        const data = await response.json();
        
        // Check if response has expected format
        if (!data || (data.success === false)) {
            throw new Error(data.message || 'Resposta inválida do servidor');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        showError(`Erro ao acessar API: ${error.message}`);
        return null;
    } finally {
        hideLoading();
    }
}

// Debug helper - log important values
function debugReport(data, message = 'Debug Report') {
    console.group(message);
    console.log('Data received:', data);
    console.log('Filters:', getFilterValues());
    console.log('API URL Params:', buildQueryParams().toString());
    console.groupEnd();
}

// Helper to construct safe access to nested properties
function safeAccess(obj, path, fallback = null) {
    return path.split('.').reduce((acc, key) => 
        (acc && acc[key] !== undefined) ? acc[key] : fallback, obj);
}
