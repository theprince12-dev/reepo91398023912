/**
 * Integração entre as páginas de vendas e processamento manual
 * Este arquivo fornece funções para navegação e integração entre diferentes 
 * páginas do sistema de processamento de vendas
 */

class SalesIntegration {
    /**
     * Redireciona para a página de processamento manual com o ID da venda
     * @param {string} saleId - ID da venda a ser processada manualmente
     */
    static redirectToManualProcessing(saleId) {
        if (!saleId) {
            console.error('ID da venda não fornecido para redirecionamento');
            return;
        }
        
        // Salvar o estado atual na sessionStorage para retorno
        const currentPage = {
            page: 'sales',
            filters: {
                fromDate: document.getElementById('from-date')?.value,
                toDate: document.getElementById('to-date')?.value
            },
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('previousPage', JSON.stringify(currentPage));
        
        // Redirecionar para a página de processamento manual
        window.location.href = `processamento-manual.html?orderId=${saleId}`;
    }
    
    /**
     * Retorna à página de vendas após processamento manual
     * Restaura os filtros anteriores, se disponíveis
     */
    static returnToSalesPage() {
        // Verifica se há um estado anterior salvo
        const previousPageJson = sessionStorage.getItem('previousPage');
        
        if (previousPageJson) {
            try {
                const previousPage = JSON.parse(previousPageJson);
                
                // Se o estado anterior for da página de vendas
                if (previousPage.page === 'sales' && previousPage.filters) {
                    // Construir URL com os filtros
                    const fromDate = previousPage.filters.fromDate;
                    const toDate = previousPage.filters.toDate;
                    
                    if (fromDate && toDate) {
                        window.location.href = `sales.html?from=${fromDate}&to=${toDate}`;
                        return;
                    }
                }
            } catch (error) {
                console.error('Erro ao analisar estado anterior:', error);
            }
        }
        
        // Se não tiver estado ou ocorrer erro, retornar sem filtros
        window.location.href = 'sales.html';
    }
    
    /**
     * Abre a visualização detalhada de uma venda específica
     * @param {string} saleId - ID da venda para visualizar
     */
    static viewSaleDetails(saleId) {
        if (!saleId) {
            console.error('ID da venda não fornecido para visualização');
            return;
        }
        
        // Aqui você pode implementar uma visualização modal ou redirecionamento
        // para uma página detalhada de informações da venda
        
        // Por enquanto, apenas simulamos abrindo o processamento manual
        // em modo somente leitura
        window.location.href = `processamento-manual.html?orderId=${saleId}&readonly=true`;
    }
    
    /**
     * Configura eventos de integração na página
     * Deve ser chamado nas páginas que precisam de funções de integração
     */
    static setupIntegrationEvents() {
        // Adicionar botão de retorno na página de processamento manual
        if (window.location.pathname.includes('processamento-manual.html')) {
            const backButton = document.querySelector('#back-to-sales');
            if (backButton) {
                backButton.addEventListener('click', SalesIntegration.returnToSalesPage);
            }
        }
        
        // Checar parâmetros da URL nas páginas de venda
        if (window.location.pathname.includes('sales.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const fromDate = urlParams.get('from');
            const toDate = urlParams.get('to');
            
            if (fromDate && toDate) {
                // Se tiver parâmetros de data, aplicar aos campos de filtro
                document.getElementById('from-date').value = fromDate;
                document.getElementById('to-date').value = toDate;
                
                // Submeter o formulário para aplicar o filtro
                const filterForm = document.getElementById('sales-filter-form');
                if (filterForm) {
                    filterForm.dispatchEvent(new Event('submit'));
                }
            }
        }
    }
}

// Inicializar eventos de integração quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    SalesIntegration.setupIntegrationEvents();
});
