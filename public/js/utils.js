/**
 * Utility functions for the Mercado Livre Product App
 * This file provides common utility functions used across the application
 */

const Utils = {
    /**
     * Format a date string
     * @param {string} dateString - The date string to format
     * @param {string} format - The format to use (optional, defaults to AppConfig.ui.dateFormat)
     * @returns {string} - The formatted date string
     */
    formatDate: function(dateString, format = null) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        
        // Use the specified format or the default from AppConfig
        const dateFormat = format || AppConfig.ui.dateFormat;
        
        // Simple formatting based on the format string
        // In a real app, you might use a library like date-fns or moment.js
        if (dateFormat === 'DD/MM/YYYY') {
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        } else if (dateFormat === 'YYYY-MM-DD') {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        } else if (dateFormat === 'MM/DD/YYYY') {
            return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
        } else {
            return date.toLocaleDateString();
        }
    },
    
    /**
     * Format a currency value
     * @param {number} value - The value to format
     * @param {Object} options - Formatting options (optional, defaults to AppConfig.ui.currencyFormat)
     * @returns {string} - The formatted currency string
     */
    formatCurrency: function(value, options = null) {
        if (value === null || value === undefined) return '';
        
        // Use the specified options or the default from AppConfig
        const formatOptions = options || AppConfig.ui.currencyFormat;
        
        return new Intl.NumberFormat('pt-BR', formatOptions).format(value);
    },
    
    /**
     * Truncate a string to a specified length
     * @param {string|object} str - The string or object to truncate
     * @param {number} length - The maximum length
     * @returns {string} - The truncated string
     */
    truncateString: function(str, length = 50) {
        if (!str) return '';
        
        // Convert to string if it's not already a string (e.g., if it's an object)
        const stringValue = typeof str === 'string' ? str : 
                           (typeof str === 'object' ? JSON.stringify(str) : String(str));
        
        if (stringValue.length <= length) return stringValue;
        return stringValue.substring(0, length) + '...';
    },
    
    /**
     * Create a URL with query parameters
     * @param {string} baseUrl - The base URL
     * @param {Object} params - The query parameters
     * @returns {string} - The full URL with query parameters
     */
    createUrl: function(baseUrl, params = {}) {
        const url = new URL(baseUrl, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        return url.toString();
    },
    
    /**
     * Get URL query parameters
     * @returns {Object} - The query parameters as an object
     */
    getQueryParams: function() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    },
    
    /**
     * Show a loading spinner
     * @param {string} elementId - The ID of the element to show the spinner in
     */
    showLoading: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
            element.style.display = 'block';
        }
    },
    
    /**
     * Hide a loading spinner
     * @param {string} elementId - The ID of the element containing the spinner
     */
    hideLoading: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
            element.style.display = 'none';
        }
    },
    
    /**
     * Show an error message
     * @param {string} message - The error message
     * @param {string} elementId - The ID of the element to show the message in
     */
    showError: function(message, elementId = 'error-message') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    },
    
    /**
     * Hide an error message
     * @param {string} elementId - The ID of the element containing the message
     */
    hideError: function(elementId = 'error-message') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    },
    
    /**
     * Format the remaining time until a date
     * @param {Date} targetDate - The target date to calculate the time until
     * @returns {string} - A formatted string showing the time remaining
     */
    formatTimeRemaining: function(targetDate) {
        if (!targetDate) return 'desconhecido';
        
        const now = new Date();
        const diffMs = targetDate - now;
        
        if (diffMs <= 0) return 'expirado';
        
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffMins > 0) {
            return `${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        } else {
            return `${diffSecs} segundo${diffSecs > 1 ? 's' : ''}`;
        }
    },
    
    /**
     * Create a pagination control
     * @param {number} currentPage - The current page
     * @param {number} totalPages - The total number of pages
     * @param {Function} onPageChange - The function to call when the page changes
     * @param {string} elementId - The ID of the element to create the pagination in
     */
    createPagination: function(currentPage, totalPages, onPageChange, elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = '';
        
        // Create the pagination container
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                onPageChange(currentPage - 1);
            }
        });
        paginationContainer.appendChild(prevButton);
        
        // Page buttons
        const maxButtons = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i.toString();
            pageButton.className = i === currentPage ? 'active' : '';
            pageButton.addEventListener('click', () => {
                onPageChange(i);
            });
            paginationContainer.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
            }
        });
        paginationContainer.appendChild(nextButton);
        
        element.appendChild(paginationContainer);
    }
};
