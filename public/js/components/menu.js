/**
 * Menu flutuante responsivo para todas as páginas do sistema
 * Inclui menus suspensos e comportamento responsivo
 */

class ResponsiveMenu {
    constructor() {
        this.initialized = false;
        this.menuItems = [
            { name: 'Home', url: 'index.html', icon: 'home' },
            { name: 'Autenticação', url: 'auth.html', icon: 'key' },
            { 
                name: 'Vendas', 
                icon: 'cart',
                children: [
                    { name: 'Lista de Vendas', url: 'sales.html' },
                    { name: 'Processamento Manual', url: 'processamento-manual.html' }
                ]
            },
            { 
                name: 'Produtos', 
                icon: 'box',
                children: [
                    { name: 'Gerenciar Produtos', url: 'products.html' }
                ]
            },
            { 
                name: 'Fretes', 
                icon: 'truck',
                children: [
                    { name: 'Visão Geral', url: 'shipping.html' },
                    { name: 'Validação de Frete', url: 'validacao-simplificada.html' },
                    { name: 'Validação Modelo 2025', url: 'validacao-frete-2025.html' },
                    { name: 'Relatórios', url: 'freight-reports.html' }
                ]
            },
            { 
                name: 'Usuários', 
                icon: 'user',
                children: [
                    { name: 'Informações de Usuário', url: 'users.html' },
                    { name: 'Seletor de Usuários', url: 'user-selector.html' }
                ]
            }
        ];
    }

    /**
     * Inicializa o menu na página
     */
    init() {
        if (this.initialized) return;
        
        this.render();
        this.setupEventListeners();
        this.markActiveItem();
        
        this.initialized = true;
        
        // Adicionar classe ao body para ajustar layout
        document.body.classList.add('with-floating-menu');
    }

    /**
     * Renderiza o menu no DOM
     */
    render() {
        // Verificar se já existe um menu
        const existingMenu = document.getElementById('floating-menu-container');
        if (existingMenu) existingMenu.remove();
        
        // Criar container do menu
        const menuContainer = document.createElement('div');
        menuContainer.id = 'floating-menu-container';
        menuContainer.className = 'floating-menu-container';
        
        // Cabeçalho do menu
        const menuHeader = document.createElement('div');
        menuHeader.className = 'menu-header';
        menuHeader.innerHTML = `
            <a href="index.html" class="brand">
                <img src="images/favicon.ico" alt="Logo" class="menu-logo">
                <span>Mercado Livre API</span>
            </a>
            <button type="button" class="menu-toggle" id="menu-toggle">
                <span class="menu-icon"></span>
            </button>
        `;
        
        // Lista de itens do menu
        const menuList = document.createElement('ul');
        menuList.className = 'menu-list';
        
        // Adicionar itens ao menu
        this.menuItems.forEach(item => {
            const menuItem = document.createElement('li');
            menuItem.className = 'menu-item';
            
            if (item.children) {
                menuItem.classList.add('has-submenu');
                menuItem.innerHTML = `
                    <a href="#" class="menu-link dropdown-toggle">
                        <i class="menu-icon icon-${item.icon}"></i>
                        <span>${item.name}</span>
                        <i class="menu-arrow"></i>
                    </a>
                    <ul class="submenu">
                        ${item.children.map(child => `
                            <li class="submenu-item">
                                <a href="${child.url}" class="submenu-link">${child.name}</a>
                            </li>
                        `).join('')}
                    </ul>
                `;
            } else {
                menuItem.innerHTML = `
                    <a href="${item.url}" class="menu-link">
                        <i class="menu-icon icon-${item.icon}"></i>
                        <span>${item.name}</span>
                    </a>
                `;
            }
            
            menuList.appendChild(menuItem);
        });
        
        // Construir menu completo
        menuContainer.appendChild(menuHeader);
        menuContainer.appendChild(menuList);
        
        // Adicionar ao DOM - no topo do body para flutuar acima de tudo
        document.body.insertBefore(menuContainer, document.body.firstChild);
    }

    /**
     * Configura os listeners de eventos para interatividade do menu
     */
    setupEventListeners() {
        // Toggle de menu responsivo
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const menu = document.getElementById('floating-menu-container');
                menu.classList.toggle('expanded');
            });
        }
        
        // Toggle de submenus
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const menuItem = toggle.parentElement;
                
                // Fechar outros submenus
                document.querySelectorAll('.menu-item.has-submenu.open').forEach(item => {
                    if (item !== menuItem) {
                        item.classList.remove('open');
                    }
                });
                
                // Toggle do submenu atual
                menuItem.classList.toggle('open');
            });
        });
        
        // Fechar menu e submenus ao clicar fora
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('floating-menu-container');
            const menuToggle = document.getElementById('menu-toggle');
            
            if (!menu.contains(e.target) && e.target !== menuToggle) {
                // Fechar submenus
                document.querySelectorAll('.menu-item.has-submenu.open').forEach(item => {
                    item.classList.remove('open');
                });
                
                // Em mobile, fechar menu completamente
                if (window.innerWidth < 992) {
                    menu.classList.remove('expanded');
                }
            }
        });
        
        // Ajustar menu ao redimensionar janela
        window.addEventListener('resize', () => {
            const menu = document.getElementById('floating-menu-container');
            
            if (window.innerWidth >= 992) {
                menu.classList.remove('expanded');
            }
        });
    }

    /**
     * Marca o item de menu ativo com base na URL atual
     */
    markActiveItem() {
        const currentUrl = window.location.pathname.split('/').pop();
        
        // Função recursiva para encontrar e marcar o item ativo
        const findAndMarkActive = (items) => {
            items.forEach(item => {
                if (item.url === currentUrl) {
                    const menuLink = document.querySelector(`.menu-link[href="${item.url}"]`);
                    if (menuLink) {
                        menuLink.classList.add('active');
                        const parentItem = menuLink.closest('.menu-item');
                        if (parentItem) parentItem.classList.add('active');
                        
                        // Se for submenu, abrir o pai
                        const parentWithSubmenu = menuLink.closest('.has-submenu');
                        if (parentWithSubmenu) parentWithSubmenu.classList.add('open');
                    }
                } else if (item.children) {
                    // Procurar nos filhos
                    item.children.forEach(child => {
                        if (child.url === currentUrl) {
                            const submenuLink = document.querySelector(`.submenu-link[href="${child.url}"]`);
                            if (submenuLink) {
                                submenuLink.classList.add('active');
                                
                                // Marcar e abrir o pai
                                const parentItem = submenuLink.closest('.menu-item');
                                if (parentItem) {
                                    parentItem.classList.add('active');
                                    parentItem.classList.add('open');
                                }
                            }
                        }
                    });
                }
            });
        };
        
        findAndMarkActive(this.menuItems);
    }
}

// Exportar para uso global
window.responsiveMenu = new ResponsiveMenu();

// Inicializar o menu quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.responsiveMenu.init();
});
