/**
 * Sales Options - Adiciona opções para escolher entre o validador original e simplificado
 */

const SalesOptions = {
    // Flag para armazenar se estamos usando o validador simplificado
    useSimplifiedValidator: true,

    // Elementos DOM para mutação
    validatorTypeSelector: null,
    statusBarElem: null,

    init() {
        console.log('SalesOptions: Inicializando opções de validação de frete');
        this.addValidatorSelector();
        this.addStatusBar();
        this.loadSavedPreferences();
    },

    // Adiciona o seletor de tipo de validação
    addValidatorSelector() {
        // Inserir após o "Modo de Processamento"
        const modeCard = document.querySelector('.card.mb-3:nth-of-type(2)');
        if (!modeCard) {
            console.warn('SalesOptions: Não foi possível encontrar o card de modo de processamento');
            return;
        }

        const validatorCard = document.createElement('div');
        validatorCard.className = 'card mb-3';
        validatorCard.innerHTML = `
            <div class="card-header">Tipo de Validação de Frete</div>
            <div class="card-body">
                <div class="form-group">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="custom-control custom-radio">
                                <input type="radio" id="validator-simplified" name="validator-type" class="custom-control-input" value="simplified" checked>
                                <label class="custom-control-label" for="validator-simplified"><strong>Validador Simplificado</strong> - Utiliza dimensões diretamente da API</label>
                            </div>
                            <p class="text-muted ml-4 mt-1">Nova implementação que obtém dados atualizados diretamente da API e calcula com maior precisão.</p>
                        </div>
                        <div class="col-md-6">
                            <div class="custom-control custom-radio">
                                <input type="radio" id="validator-original" name="validator-type" class="custom-control-input" value="original">
                                <label class="custom-control-label" for="validator-original"><strong>Validador Original</strong> - Utiliza dados armazenados no banco</label>
                            </div>
                            <p class="text-muted ml-4 mt-1">Implementação anterior que depende dos dados já processados no banco de dados.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inserir após o card de modo de processamento
        modeCard.parentNode.insertBefore(validatorCard, modeCard.nextSibling);
        
        // Guardar referência e adicionar event listeners
        this.validatorTypeSelector = validatorCard;
        
        // Adicionar event listeners
        document.getElementById('validator-simplified').addEventListener('change', () => this.setValidatorType('simplified'));
        document.getElementById('validator-original').addEventListener('change', () => this.setValidatorType('original'));
    },
    
    // Adiciona uma barra de status para informar o tipo de validação ativo
    addStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'alert alert-info mb-3';
        statusBar.id = 'validator-status';
        statusBar.style.display = 'none';
        statusBar.innerHTML = `
            <strong>Validação Simplificada Ativa!</strong> 
            A validação de frete utilizará a nova implementação que obtém dimensões diretamente da API.
            <button class="btn btn-sm btn-outline-info float-right toggle-validator-type">Mudar</button>
        `;
        
        // Inserir antes da área de resultados
        const resultsCard = document.querySelector('.card.mb-3:nth-of-type(4)'); 
        if (resultsCard) {
            resultsCard.parentNode.insertBefore(statusBar, resultsCard);
            
            // Guardar referência
            this.statusBarElem = statusBar;
            
            // Adicionar event listener ao botão
            statusBar.querySelector('.toggle-validator-type').addEventListener('click', () => this.toggleValidatorType());
        }
    },
    
    // Configura o tipo de validador a ser usado
    setValidatorType(type) {
        if (type === 'simplified') {
            this.useSimplifiedValidator = true;
            if (this.statusBarElem) {
                this.statusBarElem.className = 'alert alert-info mb-3';
                this.statusBarElem.innerHTML = `
                    <strong>Validação Simplificada Ativa!</strong> 
                    A validação de frete utilizará a nova implementação que obtém dimensões diretamente da API.
                    <button class="btn btn-sm btn-outline-info float-right toggle-validator-type">Mudar</button>
                `;
                this.statusBarElem.style.display = 'block';
            }
        } else {
            this.useSimplifiedValidator = false;
            if (this.statusBarElem) {
                this.statusBarElem.className = 'alert alert-warning mb-3';
                this.statusBarElem.innerHTML = `
                    <strong>Validação Original Ativa!</strong> 
                    A validação de frete utilizará o método anterior que depende dos dados no banco.
                    <button class="btn btn-sm btn-outline-warning float-right toggle-validator-type">Mudar</button>
                `;
                this.statusBarElem.style.display = 'block';
            }
        }
        
        // Adicionar event listener ao botão
        if (this.statusBarElem) {
            this.statusBarElem.querySelector('.toggle-validator-type').addEventListener('click', () => this.toggleValidatorType());
        }
        
        // Salvar a preferência
        localStorage.setItem('validatorType', type);
        
        console.log(`SalesOptions: Tipo de validador definido para "${type}"`);
    },
    
    // Alterna entre os tipos de validador
    toggleValidatorType() {
        if (this.useSimplifiedValidator) {
            document.getElementById('validator-original').checked = true;
            this.setValidatorType('original');
        } else {
            document.getElementById('validator-simplified').checked = true;
            this.setValidatorType('simplified');
        }
    },
    
    // Carrega as preferências salvas anteriormente
    loadSavedPreferences() {
        const savedType = localStorage.getItem('validatorType') || 'simplified';
        if (savedType === 'original') {
            document.getElementById('validator-original').checked = true;
            this.setValidatorType('original');
        } else {
            document.getElementById('validator-simplified').checked = true;
            this.setValidatorType('simplified');
        }
    },
    
    // Retorna o método de validação apropriado com base nas preferências do usuário
    getValidationMethod() {
        return this.useSimplifiedValidator ? 'simplified' : 'original';
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    SalesOptions.init();
});
