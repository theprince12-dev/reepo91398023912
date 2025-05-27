/**
 * Gerenciamento de interface para processamento manual de vendas
 * Este arquivo implementa a lógica de interação e UI da página de processamento manual
 */

// Estado do processamento atual
let currentProcessingState = {
    orderId: null,
    step1_completed: false,
    step2_completed: false,
    step3_completed: false,
    step4_completed: false,
    step5_completed: false,
    results: {
        step1: null,
        step2: null,
        step3: null,
        step4: null,
        step5: null
    }
};

// Histórico de processamentos
const processingHistory = [];

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkUrlParams();
});

/**
 * Configura os event listeners para a página
 */
function setupEventListeners() {
    // Form principal para consulta de venda
    const processingForm = document.getElementById('processingForm');
    if (processingForm) {
        processingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const orderId = document.getElementById('orderId').value.trim();
            if (orderId) {
                initializeProcessing(orderId);
            }
        });
    }
    
    // Botões de etapas
    const step1Button = document.getElementById('step1Button');
    if (step1Button) {
        step1Button.addEventListener('click', function() {
            executeStep(1);
        });
    }
    
    const step2Button = document.getElementById('step2Button');
    if (step2Button) {
        step2Button.addEventListener('click', function() {
            executeStep(2);
        });
    }
    
    const step3Button = document.getElementById('step3Button');
    if (step3Button) {
        step3Button.addEventListener('click', function() {
            executeStep(3);
        });
    }
    
    const step4Button = document.getElementById('step4Button');
    if (step4Button) {
        step4Button.addEventListener('click', function() {
            executeStep(4);
        });
    }
    
    const step5Button = document.getElementById('step5Button');
    if (step5Button) {
        step5Button.addEventListener('click', function() {
            executeStep(5);
        });
    }
    
    // Botão para executar todos os passos
    const executeAllButton = document.getElementById('executeAllButton');
    if (executeAllButton) {
        executeAllButton.addEventListener('click', function() {
            executeAllSteps();
        });
    }
    
    // Botão para reiniciar processamento
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            resetProcessing();
        });
    }
}

/**
 * Verifica parâmetros da URL para processamento automático
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const readonly = urlParams.get('readonly') === 'true';
    
    if (orderId) {
        document.getElementById('orderId').value = orderId;
        
        // Se vier com readonly, apenas consulta as informações
        if (readonly) {
            initializeProcessing(orderId, true);
        } else {
            // Caso contrário, inicia processamento normal
            initializeProcessing(orderId);
        }
    }
}

/**
 * Inicializa o processamento de uma venda
 * @param {string} orderId - ID da venda a ser processada
 * @param {boolean} readonly - Indica se é modo somente leitura (não permite edição)
 */
async function initializeProcessing(orderId, readonly = false) {
    try {
        showLoading('Verificando venda...');
        
        // Reinicia o estado atual
        resetState();
        currentProcessingState.orderId = orderId;
        
        // Verificar se a venda existe
        const verification = await ProcessamentoManualAPI.verificarVenda(orderId);
        
        if (!verification.success) {
            showError('Venda não encontrada ou não disponível para processamento.');
            return;
        }
        
        // Mostrar a interface de processamento
        document.getElementById('emptyState').classList.add('d-none');
        document.getElementById('orderDetails').classList.remove('d-none');
        document.getElementById('orderIdDisplay').textContent = orderId;
        
        // Se estiver em modo somente leitura, executar todos os passos
        // mas desabilitar botões de ação
        if (readonly) {
            document.querySelectorAll('.processing-steps button').forEach(button => {
                button.disabled = true;
            });
            
            document.getElementById('executeAllButton').disabled = true;
            document.getElementById('resetButton').disabled = true;
            
            // Executar todos os passos sem interação
            await executeAllSteps(true);
        } else {
            // Resetar estado visual da interface
            resetStepVisuals();
            enableStep(1);
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(`Erro ao inicializar processamento: ${error.message}`);
    }
}

/**
 * Executa um passo específico do processamento
 * @param {number} stepNumber - Número do passo a ser executado (1-5)
 */
async function executeStep(stepNumber) {
    if (!currentProcessingState.orderId) {
        showError('Nenhuma venda selecionada para processamento.');
        return;
    }
    
    try {
        const orderId = currentProcessingState.orderId;
        setStepStatus(stepNumber, 'active');
        
        showLoading(`Executando passo ${stepNumber}...`);
        
        let result;
        
        switch (stepNumber) {
            case 1:
                result = await ProcessamentoManualAPI.obterDadosVenda(orderId);
                updateOrderSummary(result.data);
                break;
                
            case 2:
                result = await ProcessamentoManualAPI.obterItensVenda(orderId);
                break;
                
            case 3:
                result = await ProcessamentoManualAPI.processarDadosEnvio(orderId);
                break;
                
            case 4:
                result = await ProcessamentoManualAPI.validarFrete(orderId);
                break;
                
            case 5:
                result = await ProcessamentoManualAPI.finalizarProcessamento(orderId);
                document.getElementById('processingComplete').classList.remove('d-none');
                break;
                
            default:
                throw new Error('Passo inválido.');
        }
        
        if (!result.success) {
            throw new Error(result.message || `Erro no passo ${stepNumber}`);
        }
        
        // Atualizar o estado atual
        currentProcessingState[`step${stepNumber}_completed`] = true;
        currentProcessingState.results[`step${stepNumber}`] = result;
        
        // Mostrar resultado
        displayStepResult(stepNumber, result);
        
        // Marcar como concluído e habilitar próximo passo
        setStepStatus(stepNumber, 'completed');
        
        if (stepNumber < 5) {
            enableStep(stepNumber + 1);
        }
        
        hideLoading();
        
        // Adicionar ao histórico se for o último passo
        if (stepNumber === 5) {
            addToHistory(orderId);
        }
        
        return result;
    } catch (error) {
        hideLoading();
        setStepStatus(stepNumber, 'error');
        showError(`Erro no passo ${stepNumber}: ${error.message}`);
        throw error;
    }
}

/**
 * Executa todos os passos do processamento em sequência
 * @param {boolean} quiet - Se true, não mostra mensagens de erro entre passos
 */
async function executeAllSteps(quiet = false) {
    if (!currentProcessingState.orderId) {
        showError('Nenhuma venda selecionada para processamento.');
        return;
    }
    
    const orderId = currentProcessingState.orderId;
    
    try {
        showLoading('Executando todos os passos...');
        
        // Primeira abordagem: tentar executar o método que faz tudo de uma vez no backend
        try {
            const result = await ProcessamentoManualAPI.executarTodosPassos(orderId);
            
            if (result.success) {
                // Se tiver resultado de cada passo individual, mostrar um por um
                if (result.step1_result) {
                    updateOrderSummary(result.step1_result);
                    displayStepResult(1, { success: true, data: result.step1_result });
                    setStepStatus(1, 'completed');
                    currentProcessingState.step1_completed = true;
                    currentProcessingState.results.step1 = result.step1_result;
                }
                
                if (result.step2_result) {
                    displayStepResult(2, { success: true, items: result.step2_result });
                    setStepStatus(2, 'completed');
                    currentProcessingState.step2_completed = true;
                    currentProcessingState.results.step2 = result.step2_result;
                }
                
                if (result.step3_result) {
                    displayStepResult(3, { success: true, shipping_data: result.step3_result });
                    setStepStatus(3, 'completed');
                    currentProcessingState.step3_completed = true;
                    currentProcessingState.results.step3 = result.step3_result;
                }
                
                if (result.step4_result) {
                    displayStepResult(4, { success: true, validation_result: result.step4_result });
                    setStepStatus(4, 'completed');
                    currentProcessingState.step4_completed = true;
                    currentProcessingState.results.step4 = result.step4_result;
                }
                
                if (result.step5_result) {
                    displayStepResult(5, { success: true, result: result.step5_result });
                    setStepStatus(5, 'completed');
                    currentProcessingState.step5_completed = true;
                    currentProcessingState.results.step5 = result.step5_result;
                }
                
                document.getElementById('processingComplete').classList.remove('d-none');
                addToHistory(orderId);
                
                hideLoading();
                return;
            }
        } catch (allStepsError) {
            console.warn('Falha ao executar todos os passos de uma vez. Tentando executar um a um:', allStepsError);
            
            // Se falhar, não mostrar erro e tentar método alternativo
            if (!quiet) {
                hideLoading();
                showLoading('Processando passo a passo...');
            }
        }
        
        // Segunda abordagem: executar cada passo individualmente
        try {
            // Passo 1
            await executeStep(1);
            
            // Passo 2
            await executeStep(2);
            
            // Passo 3
            await executeStep(3);
            
            // Passo 4
            await executeStep(4);
            
            // Passo 5
            await executeStep(5);
            
            hideLoading();
        } catch (stepError) {
            hideLoading();
            
            if (!quiet) {
                showError(`Processamento interrompido: ${stepError.message}`);
            }
        }
    } catch (error) {
        hideLoading();
        
        if (!quiet) {
            showError(`Erro ao executar todos os passos: ${error.message}`);
        }
    }
}

/**
 * Reinicia o processamento da venda atual
 */
async function resetProcessing() {
    if (!currentProcessingState.orderId) {
        return;
    }
    
    try {
        showLoading('Reiniciando processamento...');
        
        // Limpar dados no backend
        await ProcessamentoManualAPI.limparDadosProcessamento(currentProcessingState.orderId);
        
        // Reiniciar interface
        resetStepVisuals();
        document.getElementById('processingComplete').classList.add('d-none');
        
        // Redefinir estado
        const orderId = currentProcessingState.orderId;
        resetState();
        currentProcessingState.orderId = orderId;
        
        // Habilitar apenas o primeiro passo
        enableStep(1);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(`Erro ao reiniciar processamento: ${error.message}`);
    }
}

/**
 * Atualiza o resumo de detalhes da venda na interface
 * @param {Object} orderData - Dados da venda
 */
function updateOrderSummary(orderData) {
    if (!orderData) return;
    
    // Formatar data
    const orderDate = orderData.date_created ? new Date(orderData.date_created).toLocaleString() : '-';
    document.getElementById('orderDate').textContent = orderDate;
    
    // Status
    document.getElementById('orderStatus').textContent = orderData.status || '-';
    
    // Total
    const total = orderData.total_amount ? formatCurrency(orderData.total_amount) : '-';
    document.getElementById('orderTotal').textContent = total;
    
    // Comprador
    const buyerName = orderData.buyer ? orderData.buyer.nickname || orderData.buyer.name : '-';
    document.getElementById('buyerName').textContent = buyerName;
    
    // Dados de envio
    if (orderData.shipping) {
        document.getElementById('shippingMethod').textContent = orderData.shipping.shipping_option?.name || '-';
        document.getElementById('shippingId').textContent = orderData.shipping.id || '-';
        document.getElementById('shippingStatus').textContent = orderData.shipping.status || '-';
        document.getElementById('shippingCost').textContent = orderData.shipping.cost ? formatCurrency(orderData.shipping.cost) : '-';
    }
}

/**
 * Mostra o resultado de um passo específico na interface
 * @param {number} stepNumber - Número do passo
 * @param {Object} result - Resultado do passo
 */
function displayStepResult(stepNumber, result) {
    const resultElement = document.getElementById(`step${stepNumber}Result`);
    const detailsElement = document.getElementById(`step${stepNumber}Details`);
    
    if (!resultElement || !detailsElement) return;
    
    // Mostrar detalhes
    detailsElement.classList.remove('d-none');
    
    // Transformar o resultado em JSON formatado para exibição
    const formattedResult = JSON.stringify(result, null, 2);
    resultElement.textContent = formattedResult;
}

/**
 * Define o status visual de um passo
 * @param {number} stepNumber - Número do passo
 * @param {string} status - Status: 'active', 'completed', 'error' ou 'pending'
 */
function setStepStatus(stepNumber, status) {
    const stepCard = document.querySelector(`.processing-steps .step-card:nth-child(${stepNumber})`);
    const statusBadge = document.getElementById(`step${stepNumber}Status`);
    
    if (!stepCard || !statusBadge) return;
    
    // Remover classes existentes
    stepCard.classList.remove('active', 'completed', 'error');
    statusBadge.classList.remove('bg-secondary', 'bg-primary', 'bg-success', 'bg-danger');
    
    // Aplicar novas classes conforme o status
    switch (status) {
        case 'active':
            stepCard.classList.add('active');
            statusBadge.classList.add('bg-primary');
            statusBadge.textContent = 'Em Processamento';
            break;
            
        case 'completed':
            stepCard.classList.add('completed');
            statusBadge.classList.add('bg-success');
            statusBadge.textContent = 'Concluído';
            break;
            
        case 'error':
            stepCard.classList.add('error');
            statusBadge.classList.add('bg-danger');
            statusBadge.textContent = 'Erro';
            break;
            
        default:
            // Pendente
            statusBadge.classList.add('bg-secondary');
            statusBadge.textContent = 'Pendente';
    }
}

/**
 * Habilita um passo específico para execução
 * @param {number} stepNumber - Número do passo a ser habilitado
 */
function enableStep(stepNumber) {
    const stepButton = document.getElementById(`step${stepNumber}Button`);
    
    if (stepButton) {
        stepButton.disabled = false;
    }
}

/**
 * Adiciona um processamento ao histórico
 * @param {string} orderId - ID da venda processada
 */
function addToHistory(orderId) {
    const timestamp = new Date().toLocaleString();
    
    // Criar entrada no histórico
    const historyEntry = {
        orderId,
        timestamp,
        success: true,
        results: { ...currentProcessingState.results }
    };
    
    // Adicionar ao início da lista
    processingHistory.unshift(historyEntry);
    
    // Atualizar UI do histórico
    updateHistoryUI();
}

/**
 * Atualiza a UI da seção de histórico
 */
function updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (!historyList || !emptyHistory) return;
    
    // Verificar se há itens no histórico
    if (processingHistory.length === 0) {
        emptyHistory.classList.remove('d-none');
        return;
    }
    
    // Esconder mensagem de histórico vazio
    emptyHistory.classList.add('d-none');
    
    // Limpar lista
    historyList.innerHTML = '';
    
    // Adicionar cada item ao histórico
    processingHistory.forEach((entry, index) => {
        const listItem = document.createElement('a');
        listItem.href = '#';
        listItem.className = 'list-group-item list-group-item-action';
        listItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">Venda #${entry.orderId}</h6>
                <small>${entry.timestamp}</small>
            </div>
            <p class="mb-1">
                Passos concluídos: 
                <span class="badge bg-success">${countCompletedSteps(entry)}/5</span>
            </p>
        `;
        
        // Adicionar evento para carregar este item
        listItem.addEventListener('click', function(e) {
            e.preventDefault();
            loadHistoryEntry(index);
        });
        
        historyList.appendChild(listItem);
    });
}

/**
 * Conta quantos passos foram concluídos em uma entrada do histórico
 * @param {Object} entry - Entrada do histórico
 * @returns {number} - Número de passos concluídos
 */
function countCompletedSteps(entry) {
    let count = 0;
    
    for (let i = 1; i <= 5; i++) {
        if (entry.results[`step${i}`]) {
            count++;
        }
    }
    
    return count;
}

/**
 * Carrega uma entrada do histórico como o processamento atual
 * @param {number} index - Índice da entrada no array de histórico
 */
function loadHistoryEntry(index) {
    const entry = processingHistory[index];
    
    if (!entry) return;
    
    // Reiniciar estado
    resetState();
    resetStepVisuals();
    
    // Carregar dados do histórico
    currentProcessingState.orderId = entry.orderId;
    document.getElementById('orderId').value = entry.orderId;
    
    // Mostrar interface de processamento
    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('orderDetails').classList.remove('d-none');
    document.getElementById('orderIdDisplay').textContent = entry.orderId;
    
    // Carregar cada passo
    for (let i = 1; i <= 5; i++) {
        const result = entry.results[`step${i}`];
        
        if (result) {
            // Atualizar estado
            currentProcessingState[`step${i}_completed`] = true;
            currentProcessingState.results[`step${i}`] = result;
            
            // Atualizar UI
            displayStepResult(i, result);
            setStepStatus(i, 'completed');
            
            // Se for passo 1, atualizar resumo da venda
            if (i === 1 && result.data) {
                updateOrderSummary(result.data);
            }
            
            // Habilitar próximo passo
            if (i < 5) {
                enableStep(i + 1);
            }
        }
    }
    
    // Se todos os passos foram concluídos, mostrar mensagem
    if (currentProcessingState.step5_completed) {
        document.getElementById('processingComplete').classList.remove('d-none');
    } else {
        document.getElementById('processingComplete').classList.add('d-none');
    }
}

/**
 * Reinicia o estado visual dos passos
 */
function resetStepVisuals() {
    // Resetar status e esconder resultados
    for (let i = 1; i <= 5; i++) {
        setStepStatus(i, 'pending');
        
        const detailsElement = document.getElementById(`step${i}Details`);
        if (detailsElement) {
            detailsElement.classList.add('d-none');
        }
        
        const resultElement = document.getElementById(`step${i}Result`);
        if (resultElement) {
            resultElement.textContent = '';
        }
        
        // Desabilitar botões exceto o primeiro
        const buttonElement = document.getElementById(`step${i}Button`);
        if (buttonElement) {
            buttonElement.disabled = i !== 1;
        }
    }
    
    // Esconder alerta de processamento completo
    document.getElementById('processingComplete').classList.add('d-none');
    
    // Esconder erro, se houver
    document.getElementById('errorContainer').classList.add('d-none');
    
    // Limpar campos do resumo da venda
    document.getElementById('orderDate').textContent = '-';
    document.getElementById('orderStatus').textContent = '-';
    document.getElementById('orderTotal').textContent = '-';
    document.getElementById('buyerName').textContent = '-';
    document.getElementById('shippingMethod').textContent = '-';
    document.getElementById('shippingId').textContent = '-';
    document.getElementById('shippingStatus').textContent = '-';
    document.getElementById('shippingCost').textContent = '-';
}

/**
 * Reinicia o estado de processamento atual
 */
function resetState() {
    currentProcessingState = {
        orderId: null,
        step1_completed: false,
        step2_completed: false,
        step3_completed: false,
        step4_completed: false,
        step5_completed: false,
        results: {
            step1: null,
            step2: null,
            step3: null,
            step4: null,
            step5: null
        }
    };
}

/**
 * Mostra um erro na interface
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('d-none');
    }
}

/**
 * Esconde o erro da interface
 */
function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    
    if (errorContainer) {
        errorContainer.classList.add('d-none');
    }
}

/**
 * Mostra o indicador de carregamento
 * @param {string} message - Mensagem de carregamento
 */
function showLoading(message = 'Carregando...') {
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingContainer && loadingMessage) {
        loadingMessage.textContent = message;
        loadingContainer.classList.remove('d-none');
    }
}

/**
 * Esconde o indicador de carregamento
 */
function hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    
    if (loadingContainer) {
        loadingContainer.classList.add('d-none');
    }
}

/**
 * Formata um valor como moeda (R$)
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
