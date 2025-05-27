/**
 * Script para manipulação do seletor de usuários
 * Permite selecionar e utilizar tokens de diferentes usuários para operações na API
 */

class UserSelector {
    constructor() {
        this.currentUser = null;
        this.savedUsers = [];
        this.selectedUserId = null;
        
        // Elementos da UI
        this.currentUserLoading = document.getElementById('current-user-loading');
        this.currentUserDetails = document.getElementById('current-user-details');
        this.noCurrentUser = document.getElementById('no-current-user');
        this.savedUsersLoading = document.getElementById('saved-users-loading');
        this.savedUsersList = document.getElementById('saved-users-list');
        this.noSavedUsers = document.getElementById('no-saved-users');
    }
    
    /**
     * Inicializa o componente de seleção de usuários
     */
    async init() {
        try {
            // Carregar informações iniciais
            await this.loadCurrentUser();
            await this.loadSavedUsers();
        } catch (error) {
            console.error('Erro ao inicializar o seletor de usuários:', error);
            this.showMessage('Erro ao carregar usuários', 'danger');
        }
    }
    
    /**
     * Carrega informações do usuário atual
     */
    async loadCurrentUser() {
        try {
            this.currentUserLoading.style.display = 'block';
            this.currentUserDetails.style.display = 'none';
            this.noCurrentUser.style.display = 'none';
            
            const userData = await ApiService.getCurrentUser();
            
            if (userData && userData.id) {
                this.currentUser = userData;
                
                // Preencher detalhes do usuário atual
                document.getElementById('current-user-name').textContent = userData.name || userData.nickname || 'Usuário';
                document.getElementById('current-user-id').textContent = `ID: ${userData.id}`;
                document.getElementById('current-user-nickname').textContent = userData.nickname || 'N/A';
                document.getElementById('current-user-status').textContent = userData.status || 'Ativo';
                document.getElementById('current-user-type').textContent = userData.user_type || 'N/A';
                document.getElementById('current-user-reputation').textContent = userData.seller?.reputation?.level_id || 'N/A';
                
                // Avatar com iniciais
                const initials = this.getInitials(userData.name || userData.nickname || 'U');
                document.getElementById('current-user-avatar').textContent = initials;
                
                // Badges do usuário
                const badgesContainer = document.getElementById('current-user-badges');
                badgesContainer.innerHTML = '';
                
                if (userData.seller) {
                    if (userData.seller.mercadoenvios_status === true) {
                        this.addBadge(badgesContainer, 'Mercado Envios');
                    }
                    
                    if (userData.seller.mercadopago_account_type) {
                        this.addBadge(badgesContainer, 'Mercado Pago');
                    }
                    
                    if (userData.seller.carousel_status) {
                        this.addBadge(badgesContainer, 'Carousel');
                    }
                }
                
                this.currentUserDetails.style.display = 'block';
            } else {
                this.noCurrentUser.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar usuário atual:', error);
            this.noCurrentUser.style.display = 'block';
        } finally {
            this.currentUserLoading.style.display = 'none';
        }
    }
    
    /**
     * Carrega a lista de usuários salvos
     */
    async loadSavedUsers() {
        try {
            this.savedUsersLoading.style.display = 'block';
            this.savedUsersList.style.display = 'none';
            this.noSavedUsers.style.display = 'none';
            
            // Obter os tokens salvos usando ApiService
            const data = await ApiService.getUserTokens();
            
            console.log('Resposta da API tokens:', data);
            
            // Verificar se existem tokens e processá-los
            if (data && data.success && data.tokens) {
                // Combinar usuários ativos e inativos em um único array
                const allUsers = [
                    ...(data.tokens.active || []),
                    ...(data.tokens.inactive || [])
                ];
                
                console.log(`Total de usuários encontrados: ${allUsers.length}`);
                console.log('Usuários ativos:', data.tokens.active);
                console.log('Usuários inativos:', data.tokens.inactive);
                
                if (allUsers.length > 0) {
                    this.savedUsers = allUsers;
                    
                    // Obter o usuário selecionado
                    const selectedUserResponse = await ApiService.getSelectedUser();
                    if (selectedUserResponse.success && selectedUserResponse.selected) {
                        this.selectedUserId = selectedUserResponse.user.id;
                    }
                    
                    // Renderizar lista de usuários
                    this.renderUsersList(this.savedUsers);
                    this.savedUsersList.style.display = 'block';
                } else {
                    this.noSavedUsers.style.display = 'block';
                }
            } else {
                console.error('Formato inválido na resposta de tokens:', data);
                this.noSavedUsers.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar usuários salvos:', error);
            this.noSavedUsers.style.display = 'block';
        } finally {
            this.savedUsersLoading.style.display = 'none';
        }
    }
    
    /**
     * Renderiza a lista de usuários disponíveis
     * @param {Array} users - Lista de usuários para renderizar
     */
    renderUsersList(users) {
        this.savedUsersList.innerHTML = '';
        
        users.forEach(user => {
            console.log('Renderizando usuário:', user);
            
            // Verificar se temos todos os dados necessários
            if (!user || !user.id) {
                console.error('Dados de usuário incompletos:', user);
                return; // Pular este usuário
            }
            
            const userCard = document.createElement('div');
            userCard.className = `user-card d-flex align-items-center position-relative mb-2 ${user.id === this.selectedUserId ? 'selected' : ''}`;
            userCard.dataset.userId = user.id;
            
            // Tentar obter iniciais do nome
            const initials = this.getInitials(user.name || user.nickname || 'U');
            
            // Determinar o token para exibição
            let tokenDisplay = 'N/A';
            if (user.access_token) {
                tokenDisplay = this.truncateToken(user.access_token);
            } else if (user.token && user.token.id) {
                tokenDisplay = `ID: ${user.token.id}`;
            }
            
            // Determinar o status do usuário (ativo/inativo)
            let userStatus = 'Ativo';
            let statusClass = 'text-success';
            
            if (user.token && user.token.time_expired) {
                userStatus = 'Inativo (Token Expirado)';
                statusClass = 'text-danger';
            }
            
            userCard.innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <h3 class="user-name">${user.name || user.nickname || 'Usuário'}</h3>
                    <div class="user-id">ID: ${user.id}</div>
                    <div class="user-details">
                        <p><strong>Tipo:</strong> ${user.user_type || 'N/A'}</p>
                        <p class="${statusClass}"><strong>Status:</strong> ${userStatus}</p>
                        <p><strong>Token:</strong></p>
                        <div class="user-token">${tokenDisplay}</div>
                    </div>
                </div>
                <div class="user-level">${user.level_id || user.level || 'N/A'}</div>
            `;
            
            // Adicionar evento de clique para seleção
            userCard.addEventListener('click', () => this.selectUser(user));
            
            this.savedUsersList.appendChild(userCard);
        });
    }
    
    /**
     * Seleciona um usuário para ser utilizado nas operações
     * @param {Object} user - Objeto com informações do usuário
     */
    async selectUser(user) {
        try {
            this.selectedUserId = user.id;
            
            // Destacar o card selecionado
            const userCards = document.querySelectorAll('.user-card');
            userCards.forEach(card => {
                if (card.dataset.userId === user.id) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
            
            // Verificar se o token precisa ser renovado
            let needsRefresh = false;
            if (user.token && user.token.time_expired) {
                needsRefresh = true;
                this.showMessage('Token expirado. Tentando renovar...', 'info');
            }
            
            let result;
            if (needsRefresh) {
                // Tentar renovar o token primeiro
                result = await ApiService.refreshUserToken(user.id);
                if (!result.success) {
                    this.showMessage(`Erro ao renovar token: ${result.message}`, 'danger');
                    return;
                }
                this.showMessage('Token renovado com sucesso!', 'success');
            }
            
            // Selecionar o usuário usando ApiService
            result = await ApiService.selectUser(user.id);
            
            if (result.success) {
                // Recarregar o usuário atual
                await this.loadCurrentUser();
                
                // Recarregar a lista de usuários para atualizar status
                await this.loadSavedUsers();
                
                // Mostrar mensagem de sucesso
                this.showMessage('Usuário selecionado com sucesso!', 'success');
            } else {
                this.showMessage(`Erro ao selecionar usuário: ${result.message}`, 'danger');
            }
        } catch (error) {
            console.error('Erro ao selecionar usuário:', error);
            this.showMessage('Erro ao selecionar usuário. Consulte o console para mais detalhes.', 'danger');
        }
    }
    
    /**
     * Obtém as iniciais de um nome
     * @param {string} name - Nome para extrair iniciais
     * @returns {string} - Iniciais do nome
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }
    
    /**
     * Trunca o token para exibição
     * @param {string} token - Token para truncar
     * @returns {string} - Token truncado
     */
    truncateToken(token) {
        if (!token) return 'N/A';
        return token.substring(0, 10) + '...' + token.substring(token.length - 10);
    }
    
    /**
     * Adiciona uma badge ao container
     * @param {HTMLElement} container - Elemento onde adicionar a badge
     * @param {string} text - Texto da badge
     */
    addBadge(container, text) {
        const badge = document.createElement('span');
        badge.className = 'user-badge';
        badge.textContent = text;
        container.appendChild(badge);
    }
    
    /**
     * Exibe uma mensagem temporária para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo da mensagem (success, danger, info)
     */
    showMessage(message, type = 'info') {
        // Verificar se já existe uma mensagem
        let alertElement = document.querySelector('.alert-floating');
        
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = `alert-floating alert-${type}`;
            document.body.appendChild(alertElement);
        } else {
            // Limpar classes anteriores e adicionar a nova
            alertElement.className = `alert-floating alert-${type}`;
        }
        
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        
        // Esconder após 3 segundos
        setTimeout(() => {
            alertElement.style.opacity = '0';
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const userSelector = new UserSelector();
    userSelector.init();
});
