/**
 * Freight Report Page Script
 * Version: 1.0.0 (2025-05-14)
 * This file contains JavaScript functionality for freight-reports-new.html
 */

// Global variables
let reportData = null;
let discrepanciesData = null;
let currentPage = 1;
const itemsPerPage = 10;

// Initialize date inputs with default values (last 30 days)
document.addEventListener('DOMContentLoaded', function() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Format dates for input fields (YYYY-MM-DD)
    document.getElementById('date-from').value = formatDateForInput(thirtyDaysAgo);
    document.getElementById('date-to').value = formatDateForInput(today);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial report - set onlyLoss to false to show all divergences
    document.getElementById('only-loss').value = 'false';
    
    // Load initial report
    loadReport();
    
    // Add debug console message for tracing execution flow
    console.info('Freight Report page initialized with default settings');
});

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Show content for clicked tab
            const tabId = `${this.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
            
            console.log(`Tab switched to: ${this.dataset.tab}`);
        });
    });
    
    // Apply filters
    document.getElementById('report-filters').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Filter form submitted');
        loadReport();
    });
    
    // Export report
    document.getElementById('export-report').addEventListener('click', function() {
        console.log('Export button clicked');
        exportReport();
    });
    
    // Modal close button
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('shipment-modal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('shipment-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Load report based on filters
async function loadReport() {
    try {
        console.log('Loading report with filters:', getFilterValues());
        showLoading();
        hideError();
        
        // Get query parameters from helper
        const params = buildQueryParams();
        
        // Log request for debugging
        console.log('Sending request to /api/reports/freight/summary with params:', params.toString());
        
        // Fetch summary data
        const summaryResponse = await fetch(`/api/reports/freight/summary?${params.toString()}`);
        
        // Check for response errors
        if (!summaryResponse.ok) {
            let errorMessage = `Erro ${summaryResponse.status}: ${summaryResponse.statusText}`;
            try {
                // Try to get error details from JSON response
                const errorData = await summaryResponse.json();
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Ignore JSON parsing errors for error response
            }
            throw new Error(errorMessage);
        }
        
        // Parse summary data
        const summaryData = await summaryResponse.json();
        console.log('Summary data received:', summaryData);
        
        if (!summaryData.success) {
            throw new Error(summaryData.message || 'Erro ao carregar resumo do relatório');
        }
        
        // Save report data
        reportData = summaryData;
        
        // Update UI with summary data
        updateSummaryTab(summaryData);
        
        // Load detailed discrepancies data
        console.log('Sending request to /api/reports/freight/discrepancies with params:', params.toString());
        const discrepanciesResponse = await fetch(`/api/reports/freight/discrepancies?${params.toString()}`);
        
        // Check for response errors
        if (!discrepanciesResponse.ok) {
            console.error('Error in discrepancies response:', discrepanciesResponse.status, discrepanciesResponse.statusText);
            throw new Error(`Erro ao carregar divergências: ${discrepanciesResponse.status} ${discrepanciesResponse.statusText}`);
        }
        
        // Parse discrepancies data
        const discrepanciesResult = await discrepanciesResponse.json();
        console.log('Discrepancies data received:', discrepanciesResult);
        
        if (!discrepanciesResult.success) {
            throw new Error(discrepanciesResult.message || 'Erro ao carregar divergências');
        }
        
        // Save discrepancies data
        discrepanciesData = discrepanciesResult.discrepancies;
        
        // Display discrepancies in table
        displayDiscrepancies(discrepanciesData);
        
        // Success message
        console.log(`Report loaded successfully: ${discrepanciesData.length} discrepancies found`);
        
    } catch (error) {
        console.error('Error loading report:', error);
        showError(`Erro ao carregar relatório: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Update summary tab with report data
function updateSummaryTab(data) {
    if (!data || !data.report_meta) {
        console.error('Invalid summary data format', data);
        showError('Formato de dados inválido para resumo do relatório');
        return;
    }
    
    try {
        // Update summary cards with safe access to properties
        document.getElementById('total-sales').textContent = safeAccess(data, 'report_meta.total_sales', 0);
        document.getElementById('total-discrepancies').textContent = safeAccess(data, 'report_meta.total_shipments_analyzed', 0);
        document.getElementById('percentage-discrepancies').textContent = `${safeAccess(data, 'report_meta.loss_percentage', '0')}%`;
        document.getElementById('total-loss').textContent = `R$ ${safeAccess(data, 'report_meta.total_loss', '0,00')}`;
        
        // Create charts if data is available
        if (data.monthly_summary && data.monthly_summary.length > 0) {
            createMonthlyChart(data.monthly_summary);
            createAverageLossChart(data.monthly_summary);
        } else {
            console.warn('No monthly data available for charts');
        }
        
        if (data.top_categories && data.top_categories.length > 0) {
            createCategoriesChart(data.top_categories);
        } else {
            console.warn('No category data available for charts');
        }
        
        if (data.top_buyers && data.top_buyers.length > 0) {
            createBuyersChart(data.top_buyers);
        } else {
            console.warn('No buyer data available for charts');
        }
        
        if (data.status_summary && data.status_summary.length > 0) {
            createStatusChart(data.status_summary);
            createLossDistributionChart(data.status_summary);
        } else {
            console.warn('No status data available for charts');
        }
        
        console.log('Summary tab updated successfully');
    } catch (err) {
        console.error('Error updating summary tab:', err);
        showError(`Erro ao atualizar resumo: ${err.message}`);
    }
}

// Display discrepancies in table
function displayDiscrepancies(discrepancies) {
    if (!discrepancies || !Array.isArray(discrepancies)) {
        console.error('Invalid discrepancies data format', discrepancies);
        return;
    }
    
    try {
        const tableBody = document.querySelector('#discrepancies-table tbody');
        tableBody.innerHTML = '';  // Clear existing rows
        
        // Check if there are any discrepancies to display
        if (discrepancies.length === 0) {
            // Add empty state message
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="10" class="text-center">Nenhuma divergência encontrada com os filtros atuais</td>`;
            tableBody.appendChild(emptyRow);
            
            // Clear pagination
            document.getElementById('pagination-container').innerHTML = '';
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(discrepancies.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, discrepancies.length);
        
        console.log(`Displaying ${endIndex - startIndex} of ${discrepancies.length} discrepancies (page ${currentPage}/${totalPages})`);
        
        // Display current page items
        for (let i = startIndex; i < endIndex; i++) {
            const d = discrepancies[i];
            if (!d) continue;  // Skip undefined entries
            
            const row = document.createElement('tr');
            
            // Apply color based on status
            let statusClass = '';
            switch (d.status ? d.status.toLowerCase() : '') {
                case 'pendente': statusClass = ''; break;
                case 'validado': statusClass = 'positive-value'; break;
                case 'corrigido': statusClass = 'positive-value'; break;
                case 'ignorado': statusClass = 'text-secondary'; break;
                default: statusClass = ''; break;
            }
            
            // Format difference value with color
            const differenceClass = d.is_loss ? 'negative-value' : 'positive-value';
            
            // Safely format values
            const orderDate = d.order_date ? new Date(d.order_date).toLocaleDateString('pt-BR') : '-';
            const validationDate = d.validation_date ? new Date(d.validation_date).toLocaleDateString('pt-BR') : '-';
            
            row.innerHTML = `
                <td>${d.shipping_id || '-'}</td>
                <td>${d.sale_id || '-'}</td>
                <td>${orderDate}</td>
                <td>${d.buyer_nickname || d.buyer_id || '-'}</td>
                <td>R$ ${(d.charged_freight || 0).toFixed(2).replace('.', ',')}</td>
                <td>R$ ${(d.calculated_freight || 0).toFixed(2).replace('.', ',')}</td>
                <td class="${differenceClass}">R$ ${(d.difference || 0).toFixed(2).replace('.', ',')}</td>
                <td class="${statusClass}">${d.status || '-'}</td>
                <td>${validationDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-details" data-id="${d.shipping_id}">Detalhes</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
        
        // Add event listeners to detail buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const shippingId = this.dataset.id;
                console.log(`Viewing details for shipping ID: ${shippingId}`);
                showShipmentDetails(shippingId);
            });
        });
        
        // Create pagination
        createPagination(totalPages);
        
    } catch (error) {
        console.error('Error displaying discrepancies:', error);
        showError(`Erro ao exibir divergências: ${error.message}`);
    }
}

// Create pagination controls
function createPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '«';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayDiscrepancies(discrepanciesData);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(startPage + 4, totalPages);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(endPage - 4, 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayDiscrepancies(discrepanciesData);
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = '»';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayDiscrepancies(discrepanciesData);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Show shipment details modal
async function showShipmentDetails(shippingId) {
    if (!shippingId) {
        console.error('Invalid shipping ID');
        return;
    }
    
    try {
        const modal = document.getElementById('shipment-modal');
        const modalLoading = document.getElementById('modal-loading');
        const modalError = document.getElementById('modal-error');
        const shipmentDetails = document.getElementById('shipment-details');
        
        // Show modal
        modal.style.display = 'block';
        
        // Show loading spinner
        modalLoading.style.display = 'flex';
        modalError.style.display = 'none';
        shipmentDetails.innerHTML = '';
        
        console.log(`Fetching details for shipping ID: ${shippingId}`);
        
        // Fetch shipment details
        const response = await fetch(`/api/reports/freight/shipment/${shippingId}`);
        
        // Check for response errors
        if (!response.ok) {
            console.error('Error fetching shipment details:', response.status, response.statusText);
            throw new Error(`Erro ao carregar detalhes do envio: ${response.status} ${response.statusText}`);
        }
        
        // Parse response
        const data = await response.json();
        console.log('Shipment details received:', data);
        
        // Hide loading spinner
        modalLoading.style.display = 'none';
        
        if (!data.success) {
            throw new Error(data.message || 'Erro ao carregar detalhes do envio');
        }
        
        // Display shipment details
        const details = data.data;
        const differenceClass = details.is_loss ? 'negative-value' : 'positive-value';
        
        let detailsHTML = `
            <div class="card mb-3">
                <div class="card-header">Informações do Envio</div>
                <div class="card-body">
                    <table class="table">
                        <tr>
                            <th>ID do Envio:</th>
                            <td>${details.shipping_id || '-'}</td>
                        </tr>
                        <tr>
                            <th>ID da Venda:</th>
                            <td>${details.sale_id || '-'}</td>
                        </tr>
                        <tr>
                            <th>Frete Cobrado:</th>
                            <td>R$ ${(details.charged_freight || 0).toFixed(2).replace('.', ',')}</td>
                        </tr>
                        <tr>
                            <th>Frete Calculado:</th>
                            <td>R$ ${(details.calculated_freight || 0).toFixed(2).replace('.', ',')}</td>
                        </tr>
                        <tr>
                            <th>Diferença:</th>
                            <td class="${differenceClass}">R$ ${(details.difference || 0).toFixed(2).replace('.', ',')}</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td>${details.status || '-'}</td>
                        </tr>
                        <tr>
                            <th>Data de Validação:</th>
                            <td>${details.validation_date ? new Date(details.validation_date).toLocaleString('pt-BR') : '-'}</td>
                        </tr>
                        <tr>
                            <th>Coluna Utilizada:</th>
                            <td>${details.column_used || '-'}</td>
                        </tr>
                        <tr>
                            <th>Modo de Envio:</th>
                            <td>${details.shipping_mode || '-'}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        // Add sale details if available
        if (details.sale_details) {
            detailsHTML += `
                <div class="card">
                    <div class="card-header">Detalhes da Venda</div>
                    <div class="card-body">
                        <table class="table">
                            <tr>
                                <th>Data do Pedido:</th>
                                <td>${details.sale_details.date_created ? new Date(details.sale_details.date_created).toLocaleString('pt-BR') : '-'}</td>
                            </tr>
                            <tr>
                                <th>Comprador:</th>
                                <td>${details.sale_details.buyer_nickname || details.sale_details.buyer_id || '-'}</td>
                            </tr>
                            <tr>
                                <th>Valor Total:</th>
                                <td>R$ ${parseFloat(details.sale_details.shipping_amount || 0).toFixed(2).replace('.', ',')}</td>
                            </tr>
                            <tr>
                                <th>Valor do Frete:</th>
                                <td>R$ ${parseFloat(details.sale_details.shipping_amount || 0).toFixed(2).replace('.', ',')}</td>
                            </tr>
                            <tr>
                                <th>Quantidade de Itens:</th>
                                <td>${details.sale_details.items_count || 0}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        }
        
        shipmentDetails.innerHTML = detailsHTML;
    } catch (error) {
        console.error('Error showing shipment details:', error);
        document.getElementById('modal-error').textContent = error.message;
        document.getElementById('modal-error').style.display = 'block';
        document.getElementById('modal-loading').style.display = 'none';
    }
}

// Export report to CSV
function exportReport() {
    try {
        // Get query parameters
        const params = buildQueryParams();
        params.append('format', 'csv');
        
        // Generate download URL
        const downloadUrl = `/api/reports/freight/export?${params.toString()}`;
        
        // Create an invisible link and click it to start download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `relatorio-divergencias-frete.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Export triggered with URL:', downloadUrl);
    } catch (error) {
        console.error('Error exporting report:', error);
        showError(`Erro ao exportar relatório: ${error.message}`);
    }
}

// Create charts
function createMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }
    
    // Process data
    const months = monthlyData.map(m => {
        const [year, month] = m.month.split('-');
        return `${month}/${year}`;
    });
    const losses = monthlyData.map(m => parseFloat(m.total_loss));
    const counts = monthlyData.map(m => m.count);
    
    // Create chart
    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Prejuízo Total (R$)',
                    data: losses,
                    backgroundColor: 'rgba(211, 47, 47, 0.7)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Quantidade',
                    data: counts,
                    type: 'line',
                    borderColor: 'rgba(45, 50, 119, 0.8)',
                    backgroundColor: 'rgba(45, 50, 119, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createCategoriesChart(categoriesData) {
    const ctx = document.getElementById('categories-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.categoriesChart instanceof Chart) {
        window.categoriesChart.destroy();
    }
    
    // Process data
    const categories = categoriesData.map(c => `Cat. ${c.category_id}`);
    const losses = categoriesData.map(c => parseFloat(c.total_loss));
    
    // Create chart
    window.categoriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Prejuízo Total (R$)',
                    data: losses,
                    backgroundColor: 'rgba(211, 47, 47, 0.7)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y'
        }
    });
}

function createBuyersChart(buyersData) {
    const ctx = document.getElementById('buyers-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.buyersChart instanceof Chart) {
        window.buyersChart.destroy();
    }
    
    // Process data
    const buyers = buyersData.map(b => b.buyer_nickname || b.buyer_id);
    const losses = buyersData.map(b => parseFloat(b.total_loss));
    
    // Create chart
    window.buyersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: buyers,
            datasets: [
                {
                    label: 'Prejuízo Total (R$)',
                    data: losses,
                    backgroundColor: 'rgba(211, 47, 47, 0.7)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y'
        }
    });
}

function createStatusChart(statusData) {
    const ctx = document.getElementById('status-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.statusChart instanceof Chart) {
        window.statusChart.destroy();
    }
    
    // Process data
    const statuses = statusData.map(s => s.status);
    const counts = statusData.map(s => s.count);
    
    // Create chart
    window.statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: statuses,
            datasets: [
                {
                    data: counts,
                    backgroundColor: [
                        'rgba(211, 47, 47, 0.7)',  // vermelho
                        'rgba(76, 175, 80, 0.7)',  // verde
                        'rgba(33, 150, 243, 0.7)', // azul
                        'rgba(158, 158, 158, 0.7)' // cinza
                    ],
                    borderColor: [
                        'rgba(211, 47, 47, 1)',
                        'rgba(76, 175, 80, 1)',
                        'rgba(33, 150, 243, 1)',
                        'rgba(158, 158, 158, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createAverageLossChart(monthlyData) {
    const ctx = document.getElementById('average-loss-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.averageLossChart instanceof Chart) {
        window.averageLossChart.destroy();
    }
    
    // Process data
    const months = monthlyData.map(m => {
        const [year, month] = m.month.split('-');
        return `${month}/${year}`;
    });
    const averageLosses = monthlyData.map(m => parseFloat(m.average_loss));
    
    // Create chart
    window.averageLossChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Prejuízo Médio por Envio (R$)',
                    data: averageLosses,
                    borderColor: 'rgba(211, 47, 47, 0.8)',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createLossDistributionChart(statusData) {
    const ctx = document.getElementById('loss-distribution-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.lossDistributionChart instanceof Chart) {
        window.lossDistributionChart.destroy();
    }
    
    // Process data
    const statuses = statusData.map(s => s.status);
    const differences = statusData.map(s => parseFloat(s.total_difference));
    
    // Create chart
    window.lossDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statuses,
            datasets: [
                {
                    label: 'Diferença Total por Status (R$)',
                    data: differences,
                    backgroundColor: differences.map(d => d < 0 ? 'rgba(211, 47, 47, 0.7)' : 'rgba(76, 175, 80, 0.7)'),
                    borderColor: differences.map(d => d < 0 ? 'rgba(211, 47, 47, 1)' : 'rgba(76, 175, 80, 1)'),
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
