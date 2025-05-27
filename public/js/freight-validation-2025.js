/**
 * freight-validation-2025.js
 * Script para validação de frete do Mercado Livre com suporte às tabelas atual e 2025.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização do menu mobile
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const menuContainer = document.getElementById('floating-menu-container');
            if (menuContainer) {
                menuContainer.classList.toggle('expanded');
            }
        });
    }
    
    // Referências aos elementos do DOM
    const validationForm = document.getElementById('validationForm');
    const shippingIdInput = document.getElementById('shippingId');
    const validateBtn = document.getElementById('validateBtn');
    const listItemsBtn = document.getElementById('listItemsBtn');
    const versionAtual = document.getElementById('version-atual');
    const version2025 = document.getElementById('version-2025');
    const currentVersionBadge = document.getElementById('currentVersionBadge');
    const batchForm = document.getElementById('batchForm');
    const batchIds = document.getElementById('batchIds');
    
    // Variável para armazenar a versão atual
    let currentVersion = '2025'; // Valor padrão: 2025
    
    // Histórico de validações (armazenado localmente)
    let validationHistory = JSON.parse(localStorage.getItem('validationHistory2025') || '[]');
    
    // Atualizar a exibição do histórico ao carregar
    updateHistoryDisplay();
    
    // Event listeners para alternar entre versões
    versionAtual.addEventListener('change', function() {
        if (this.checked) {
            currentVersion = 'atual';
            currentVersionBadge.className = 'version-badge version-atual';
            currentVersionBadge.textContent = 'Tabela Atual';
            // Limpar resultados anteriores ao mudar de versão
            document.getElementById('emptyResult').classList.remove('d-none');
            document.getElementById('resultContainer').classList.add('d-none');
        }
    });
    
    version2025.addEventListener('change', function() {
        if (this.checked) {
            currentVersion = '2025';
            currentVersionBadge.className = 'version-badge version-2025';
            currentVersionBadge.textContent = 'Tabela 2025';
            // Limpar resultados anteriores ao mudar de versão
            document.getElementById('emptyResult').classList.remove('d-none');
            document.getElementById('resultContainer').classList.add('d-none');
        }
    });
    
    // Função para validar o frete
    async function validateFreight(shippingId) {
        showLoading();
        
        try {
            // Escolher o endpoint baseado na versão selecionada
            const endpoint = currentVersion === '2025' 
                ? `/api/2025/freight/validate/${shippingId}`
                : `/api/simplificado/validacao-frete/pacote/${shippingId}`;
            
            console.log(`Usando endpoint ${endpoint} para validação`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro ao validar frete');
            }
            
            console.log('Resultado da validação:', result);
            showResult(result);
            addToHistory(result);
            
        } catch (error) {
            console.error('Erro na validação:', error);
            showError(error.message);
        }
    }
    
    // Função para listar os itens de um pacote
    async function listItems(shippingId) {
        showLoadingItems();
        
        try {
            // Endpoint para listar itens (o mesmo para ambas versões)
            let endpoint = currentVersion === '2025'
                ? `/api/2025/freight/validations/${shippingId}`
                : `/api/simplificado/validacao-frete/pacote/${shippingId}/itens`;
            
            console.log(`Usando endpoint ${endpoint} para listar itens`);
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro ao listar itens');
            }
            
            console.log('Itens listados:', result);
            showItems(result);
            
        } catch (error) {
            console.error('Erro ao listar itens:', error);
            showItemsError(error.message);
        }
    }
    
    // Função para validar em lote
    async function validateBatch(shippingIds) {
        showLoadingBatch();
        
        try {
            // Endpoint para validação em lote
            const endpoint = currentVersion === '2025' 
                ? `/api/2025/freight/validations`
                : `/api/simplificado/validacao-frete/lote`;
            
            console.log(`Usando endpoint ${endpoint} para validação em lote`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shipping_ids: shippingIds })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro ao validar em lote');
            }
            
            console.log('Resultado da validação em lote:', result);
            showBatchResult(result);
            
        } catch (error) {
            console.error('Erro na validação em lote:', error);
            showBatchError(error.message);
        }
    }
    
    // Função para adicionar uma validação ao histórico
    function addToHistory(result) {
        const historyItem = {
            id: result.shipping_id,
            timestamp: new Date().toISOString(),
            status: result.status,
            frete_calculado: result.frete_calculado,
            frete_cobrado: result.frete_cobrado,
            diferenca: result.diferenca,
            versao: currentVersion
        };
        
        // Adicionar ao início do array
        validationHistory.unshift(historyItem);
        
        // Limitar a 20 itens
        if (validationHistory.length > 20) {
            validationHistory.pop();
        }
        
        // Salvar no localStorage
        localStorage.setItem('validationHistory2025', JSON.stringify(validationHistory));
        
        // Atualizar a exibição do histórico
        updateHistoryDisplay();
    }
    
    // Função para atualizar a exibição do histórico
    function updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const emptyHistory = document.getElementById('emptyHistory');
        
        if (validationHistory.length === 0) {
            historyList.classList.add('d-none');
            emptyHistory.classList.remove('d-none');
            return;
        }
        
        historyList.classList.remove('d-none');
        emptyHistory.classList.add('d-none');
        
        historyList.innerHTML = '';
        
        validationHistory.forEach((item) => {
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            let statusClass = 'bg-secondary';
            if (item.status && item.status.includes('CORRETO')) statusClass = 'bg-success';
            else if (item.status && item.status.includes('COBRANDO_MENOS')) statusClass = 'bg-warning';
            else if (item.status && item.status.includes('COBRANDO_MAIS')) statusClass = 'bg-danger';
            else if (item.status && item.status.includes('ERRO')) statusClass = 'bg-danger';
            
            const element = document.createElement('a');
            element.className = 'list-group-item list-group-item-action history-item';
            element.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">Shipping ID: ${item.id}</h6>
                    <small>${formattedDate}</small>
                </div>
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <span class="badge ${statusClass}">${item.status || 'N/D'}</span>
                    <div>
                        <span class="badge ${item.versao === '2025' ? 'bg-success' : 'bg-secondary'}">${item.versao === '2025' ? 'Tabela 2025' : 'Tabela Atual'}</span>
                        <small class="ms-2">Diferença: R$ ${(item.diferenca || 0).toFixed(2)}</small>
                    </div>
                </div>
            `;
            
            element.addEventListener('click', () => {
                // Definir a versão correta antes de validar
                if (item.versao === '2025') {
                    version2025.checked = true;
                    currentVersion = '2025';
                    currentVersionBadge.className = 'version-badge version-2025';
                    currentVersionBadge.textContent = 'Tabela 2025';
                } else {
                    versionAtual.checked = true;
                    currentVersion = 'atual';
                    currentVersionBadge.className = 'version-badge version-atual';
                    currentVersionBadge.textContent = 'Tabela Atual';
                }
                
                document.getElementById('shippingId').value = item.id;
                document.getElementById('validateBtn').click();
            });
            
            historyList.appendChild(element);
        });
    }
    
    // Função para exibir o resultado da validação
    function showResult(result) {
        document.getElementById('loadingContainer').classList.add('d-none');
        document.getElementById('emptyResult').classList.add('d-none');
        document.getElementById('resultContainer').classList.remove('d-none');
        
        // Exibir os dados
        document.getElementById('resultShippingId').textContent = result.shipping_id;
        document.getElementById('calculatedFreight').textContent = `R$ ${(result.frete_calculado || 0).toFixed(2)}`;
        document.getElementById('chargedFreight').textContent = `R$ ${(result.frete_cobrado || 0).toFixed(2)}`;
        
        const diferenca = result.diferenca || 0;
        document.getElementById('freightDifference').textContent = `R$ ${diferenca.toFixed(2)}`;
        
        if (diferenca > 0) {
            document.getElementById('freightDifference').classList.add('text-warning');
            document.getElementById('freightDifference').classList.remove('text-danger', 'text-success');
        } else if (diferenca < 0) {
            document.getElementById('freightDifference').classList.add('text-danger');
            document.getElementById('freightDifference').classList.remove('text-warning', 'text-success');
        } else {
            document.getElementById('freightDifference').classList.add('text-success');
            document.getElementById('freightDifference').classList.remove('text-warning', 'text-danger');
        }
        
        document.getElementById('freightColumn').textContent = result.coluna_frete || '-';
        
        // Exibir o status
        const statusBadge = document.getElementById('statusBadge');
        let statusClass = 'alert-secondary';
        let statusText = result.status || 'Status desconhecido';
        
        if (statusText.includes('CORRETO')) {
            statusClass = 'alert-success';
            statusText = '✓ CORRETO - Os valores de frete estão alinhados';
        } else if (statusText.includes('COBRANDO_MENOS')) {
            statusClass = 'alert-warning';
            statusText = '⚠️ COBRANDO MENOS - O Mercado Livre está cobrando menos que o esperado';
        } else if (statusText.includes('COBRANDO_MAIS')) {
            statusClass = 'alert-danger';
            statusText = '❌ COBRANDO MAIS - O Mercado Livre está cobrando mais que o esperado';
        } else if (statusText.includes('COMPRADOR_PAGOU')) {
            statusClass = 'alert-info';
            statusText = 'ℹ️ COMPRADOR PAGOU - O comprador pagou o frete';
        } else if (statusText.includes('IGNORADO_DATA_ANTERIOR')) {
            statusClass = 'alert-secondary';
            statusText = 'ℹ️ DATA ANTERIOR - Venda anterior à data de início da nova tabela';
        } else if (statusText.includes('ERRO')) {
            statusClass = 'alert-danger';
            statusText = '❌ ERRO - ' + statusText;
        }
        
        if (statusText.includes('MULTIPLO')) {
            statusText += ' (pacote com múltiplos itens)';
        }
        
        statusBadge.className = 'alert mb-3 ' + statusClass;
        statusBadge.textContent = statusText;
        
        // Exibir o JSON completo
        document.getElementById('rawResult').textContent = JSON.stringify(result, null, 2);
    }
    
    // Função para exibir a lista de itens
    function showItems(result) {
        document.getElementById('loadingItemsContainer').classList.add('d-none');
        document.getElementById('emptyItems').classList.add('d-none');
        document.getElementById('itemsContainer').classList.remove('d-none');
        
        // Mostrar o accoridion de itens
        const itemsButton = document.querySelector('button[data-bs-target="#itemsCollapse"]');
        const itemsCollapse = document.getElementById('itemsCollapse');
        
        if (itemsButton.classList.contains('collapsed')) {
            itemsButton.click();
        }
        
        // Adaptar a exibição com base na versão
        let shipping_id = '';
        let itens = [];
        let quantidade_itens = 0;
        
        if (currentVersion === '2025') {
            // Formato API 2025
            shipping_id = result.shipping_id;
            itens = Array.isArray(result.items) ? result.items : [];
            quantidade_itens = itens.length;
        } else {
            // Formato API atual
            shipping_id = result.shipping_id;
            itens = Array.isArray(result.itens) ? result.itens : [];
            quantidade_itens = result.quantidade_itens || itens.length;
        }
        
        // Atualizar o título
        document.getElementById('itemsTitle').textContent = `Itens do Pacote ${shipping_id} (${quantidade_itens} ${quantidade_itens > 1 ? 'itens' : 'item'})`;
        
        // Limpar a lista de itens
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';
        
        // Adicionar cada item
        itens.forEach((item, index) => {
            // No formato 2025, as dimensões podem estar em locais diferentes
            let dimensoes = {};
            if (currentVersion === '2025') {
                dimensoes = item.dimensions || {};
                // Converter nomenclatura se necessário
                if (dimensoes.length && !dimensoes.comprimento) dimensoes.comprimento = dimensoes.length;
                if (dimensoes.width && !dimensoes.largura) dimensoes.largura = dimensoes.width;
                if (dimensoes.height && !dimensoes.altura) dimensoes.altura = dimensoes.height;
            } else {
                dimensoes = item.dimensoes || {};
            }
            
            const temDimensoesCompletas = dimensoes.comprimento && dimensoes.largura && dimensoes.altura && dimensoes.peso;
            
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Item ${index + 1}: ${item.id}</span>
                    <span class="badge ${item.condition === 'new' || item.condicao === 'new' ? 'bg-success' : 'bg-secondary'}">
                        ${item.condition === 'new' || item.condicao === 'new' ? 'Novo' : 'Usado'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Preço:</strong> R$ ${(item.price || item.preco || 0).toFixed(2)}</p>
                            <p><strong>Quantidade:</strong> ${item.quantity || item.quantidade || 1}</p>
                            <p><strong>Categoria:</strong> ${item.category_id || item.categoria_id || 'N/D'}</p>
                        </div>
                        <div class="col-md-6">
                            <div class="dimension-info">
                                <h6 class="mb-2">Dimensões:</h6>
                                <p class="mb-1"><strong>Comprimento:</strong> ${dimensoes.comprimento || dimensoes.length || 'N/D'} cm</p>
                                <p class="mb-1"><strong>Largura:</strong> ${dimensoes.largura || dimensoes.width || 'N/D'} cm</p>
                                <p class="mb-1"><strong>Altura:</strong> ${dimensoes.altura || dimensoes.height || 'N/D'} cm</p>
                                <p class="mb-1"><strong>Peso:</strong> ${dimensoes.peso || dimensoes.weight || 'N/D'} g</p>
                                <p class="mb-1"><strong>Peso Volumétrico:</strong> ${dimensoes.peso_volumetrico_kg || 'N/D'} kg</p>
                                <p class="mb-0"><strong>Volume:</strong> ${dimensoes.volume || 'N/D'} cm³</p>
                            </div>
                            ${!temDimensoesCompletas ? '<div class="alert alert-warning mt-2 mb-0">⚠️ Dimensões incompletas</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            itemsList.appendChild(card);
        });
        
        // Exibir o JSON completo
        document.getElementById('rawItems').textContent = JSON.stringify(result, null, 2);
    }
    
    // Função para exibir o resultado do lote
    function showBatchResult(result) {
        document.getElementById('loadingBatchContainer').classList.add('d-none');
        document.getElementById('batchResultContainer').classList.remove('d-none');
        
        // Adaptar com base na versão
        let total = 0;
        let sucessos = 0;
        let erros = 0;
        let resultados = [];
        
        if (currentVersion === '2025') {
            // Formato API 2025
            total = result.results ? result.results.length : 0;
            sucessos = result.results ? result.results.filter(r => !r.error).length : 0;
            erros = result.results ? result.results.filter(r => r.error).length : 0;
            
            // Converter para formato padrão
            resultados = result.results ? result.results.map(r => ({
                shipping_id: r.shipping_id,
                status: r.error ? 'ERRO' : r.status,
                frete_calculado: r.calculated_freight,
                frete_cobrado: r.charged_freight,
                diferenca: r.difference,
                erro: r.error
            })) : [];
        } else {
            // Formato API atual
            total = result.total || 0;
            sucessos = result.sucessos || 0;
            erros = result.erros || 0;
            resultados = result.resultados || [];
        }
        
        // Exibir resumo
        document.getElementById('batchSummary').textContent = `Total: ${total} | Sucessos: ${sucessos} | Erros: ${erros}`;
        
        // Limpar os resultados
        const batchResults = document.getElementById('batchResults');
        batchResults.innerHTML = '';
        
        // Exibir cada resultado
        if (resultados && resultados.length > 0) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Shipping ID</th>
                    <th>Status</th>
                    <th>Frete Calculado</th>
                    <th>Frete Cobrado</th>
                    <th>Diferença</th>
                </tr>
            `;
            
            const tbody = document.createElement('tbody');
            
            resultados.forEach(item => {
                let statusClass = '';
                if (item.status && item.status.includes('CORRETO')) statusClass = 'bg-status-correto';
                else if (item.status && item.status.includes('COBRANDO_MENOS')) statusClass = 'bg-status-cobrando-menos';
                else if (item.status && item.status.includes('COBRANDO_MAIS')) statusClass = 'bg-status-cobrando-mais';
                else if (item.status && item.status.includes('ERRO')) statusClass = 'bg-status-erro';
                
                const row = document.createElement('tr');
                row.className = statusClass;
                row.innerHTML = `
                    <td>${item.shipping_id}</td>
                    <td>${item.status || (item.erro ? 'ERRO' : 'N/D')}</td>
                    <td>R$ ${(item.frete_calculado || 0).toFixed(2)}</td>
                    <td>R$ ${(item.frete_cobrado || 0).toFixed(2)}</td>
                    <td>R$ ${(item.diferenca || 0).toFixed(2)}</td>
                `;
                
                tbody.appendChild(row);
            });
            
            table.appendChild(thead);
            table.appendChild(tbody);
            batchResults.appendChild(table);
        }
        
        // Exibir erros
        if (erros > 0) {
            const errorItems = currentVersion === '2025' 
                ? resultados.filter(r => r.erro) 
                : (result.erros || []);
                
            if (errorItems.length > 0) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.innerHTML = '<h6>Erros:</h6>';
                
                const errorList = document.createElement('ul');
                errorItems.forEach(erro => {
                    const li = document.createElement('li');
                    li.textContent = `${erro.shipping_id}: ${erro.erro || erro.error || 'Erro desconhecido'}`;
                    errorList.appendChild(li);
                });
                
                errorDiv.appendChild(errorList);
                batchResults.appendChild(errorDiv);
            }
        }
        
        // Exibir o JSON completo
        document.getElementById('rawBatchResult').textContent = JSON.stringify(result, null, 2);
    }
    
    // Função para mostrar o indicador de carregamento da validação
    function showLoading() {
        document.getElementById('resultContainer').classList.add('d-none');
        document.getElementById('emptyResult').classList.add('d-none');
        document.getElementById('loadingContainer').classList.remove('d-none');
    }
    
    // Função para mostrar erro de validação
    function showError(message) {
        document.getElementById('loadingContainer').classList.add('d-none');
        document.getElementById('emptyResult').classList.add('d-none');
        document.getElementById('resultContainer').classList.remove('d-none');
        
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.className = 'alert mb-3 alert-danger';
        statusBadge.textContent = '❌ ERRO: ' + message;
        
        document.getElementById('calculatedFreight').textContent = '-';
        document.getElementById('chargedFreight').textContent = '-';
        document.getElementById('freightDifference').textContent = '-';
        document.getElementById('resultShippingId').textContent = document.getElementById('shippingId').value || '-';
        document.getElementById('freightColumn').textContent = '-';
        document.getElementById('rawResult').textContent = JSON.stringify({ error: message }, null, 2);
    }
    
    // Função para mostrar o indicador de carregamento da listagem de itens
    function showLoadingItems() {
        document.getElementById('itemsContainer').classList.add('d-none');
        document.getElementById('emptyItems').classList.add('d-none');
        document.getElementById('loadingItemsContainer').classList.remove('d-none');
        
        // Mostrar o accoridion de itens
        const itemsButton = document.querySelector('button[data-bs-target="#itemsCollapse"]');
        if (itemsButton.classList.contains('collapsed')) {
            itemsButton.click();
        }
    }
    
    // Função para mostrar erro de listagem de itens
    function showItemsError(message) {
        document.getElementById('loadingItemsContainer').classList.add('d-none');
        document.getElementById('emptyItems').classList.add('d-none');
        document.getElementById('itemsContainer').classList.remove('d-none');
        
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = `
            <div class="alert alert-danger">
                <h6>Erro ao listar itens:</h6>
                <p>${message}</p>
            </div>
        `;
        
        document.getElementById('itemsTitle').textContent = 'Erro ao listar itens';
        document.getElementById('rawItems').textContent = JSON.stringify({ error: message }, null, 2);
    }
    
    // Função para mostrar o indicador de carregamento da validação em lote
    function showLoadingBatch() {
        document.getElementById('batchResultContainer').classList.add('d-none');
        document.getElementById('loadingBatchContainer').classList.remove('d-none');
    }
    
    // Função para mostrar erro de validação em lote
    function showBatchError(message) {
        document.getElementById('loadingBatchContainer').classList.add('d-none');
        document.getElementById('batchResultContainer').classList.remove('d-none');
        
        document.getElementById('batchResults').innerHTML = `
            <div class="alert alert-danger">
                <h6>Erro ao validar em lote:</h6>
                <p>${message}</p>
            </div>
        `;
        
        document.getElementById('batchSummary').textContent = 'Erro na validação em lote';
        document.getElementById('rawBatchResult').textContent = JSON.stringify({ error: message }, null, 2);
    }
    
    // Event listeners
    validationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const shippingId = shippingIdInput.value.trim();
        if (shippingId) {
            validateFreight(shippingId);
        }
    });
    
    listItemsBtn.addEventListener('click', () => {
        const shippingId = shippingIdInput.value.trim();
        if (shippingId) {
            listItems(shippingId);
        }
    });
    
    batchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const batchText = batchIds.value.trim();
        if (batchText) {
            const shippingIds = batchText.split('\n')
                .map(id => id.trim())
                .filter(id => id);
            
            if (shippingIds.length > 0) {
                validateBatch(shippingIds);
            }
        }
    });
});
