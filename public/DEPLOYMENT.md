# Guia de Implantação - Mercado Livre Product App

Este documento fornece instruções detalhadas para configurar, implantar e executar a aplicação Mercado Livre Product App.

## Requisitos do Sistema

- Node.js (v14.x ou superior)
- NPM (v6.x ou superior)
- Banco de dados SQLite (incluído) ou MySQL/PostgreSQL (opcional)
- Conta de desenvolvedor no Mercado Livre

## Configuração Inicial

### 1. Clone o Repositório

```bash
git clone [URL_DO_REPOSITÓRIO]
cd mercado-livre-product-app
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Configuração do Banco de Dados
DB_DIALECT=sqlite
DB_STORAGE=mercado-livre.db

# Configuração da API do Mercado Livre
ML_APP_ID=seu_app_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
ML_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

Para obter as credenciais do Mercado Livre:
1. Acesse [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
2. Crie uma nova aplicação
3. Configure a URL de redirecionamento como `http://localhost:3000/api/auth/callback`
4. Copie o App ID e Client Secret para o arquivo `.env`

### 4. Execute as Migrações do Banco de Dados

```bash
npx sequelize-cli db:migrate
```

### 5. (Opcional) Execute os Seeders para Dados Iniciais

```bash
npx sequelize-cli db:seed:all
```

## Execução da Aplicação

### Ambiente de Desenvolvimento

```bash
npm run dev
```

### Ambiente de Produção

```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000` (ou na porta configurada no arquivo `.env`).

## Autenticação com o Mercado Livre

1. Acesse a aplicação em `http://localhost:3000`
2. Navegue até a página de Autenticação
3. Clique no botão "Autorizar com Mercado Livre"
4. Faça login na sua conta do Mercado Livre
5. Autorize a aplicação a acessar sua conta
6. Você será redirecionado de volta para a aplicação

## Estrutura do Projeto

```
mercado-livre-product-app/
├── config/                  # Configurações do Sequelize
├── migrations/              # Migrações do banco de dados
├── models/                  # Modelos do Sequelize
├── public/                  # Arquivos estáticos e frontend
│   ├── css/                 # Estilos CSS
│   ├── js/                  # Scripts JavaScript
│   ├── images/              # Imagens
│   └── *.html               # Páginas HTML
├── src/
│   ├── config/              # Configurações da aplicação
│   ├── controllers/         # Controladores da API
│   ├── middleware/          # Middlewares Express
│   ├── routes/              # Rotas da API
│   └── services/            # Serviços de negócio
├── utils/                   # Utilitários
├── .env                     # Variáveis de ambiente
├── app.js                   # Ponto de entrada da aplicação
└── package.json             # Dependências e scripts
```

## Funcionalidades Principais

- **Autenticação**: Integração OAuth com o Mercado Livre
- **Vendas**: Visualização e gerenciamento de vendas
- **Produtos**: Busca e visualização de produtos
- **Frete**: Validação de fretes para vendas
- **Usuários**: Gerenciamento de usuários e permissões

## Solução de Problemas

### Erro de Autenticação

Se você encontrar erros de autenticação:
1. Verifique se as credenciais do Mercado Livre estão corretas no arquivo `.env`
2. Certifique-se de que a URL de redirecionamento está configurada corretamente no painel de desenvolvedores do Mercado Livre
3. Limpe os cookies do navegador e tente novamente

### Erros de Banco de Dados

Se você encontrar erros relacionados ao banco de dados:
1. Verifique se o arquivo do banco de dados SQLite existe e tem permissões de escrita
2. Execute novamente as migrações: `npx sequelize-cli db:migrate:undo:all` seguido de `npx sequelize-cli db:migrate`
3. Verifique se as configurações do banco de dados no arquivo `.env` estão corretas

### Outros Erros

Para outros erros, verifique os logs do servidor e do console do navegador para obter mais informações.

## Implantação em Produção

Para implantar a aplicação em um ambiente de produção:

1. Configure as variáveis de ambiente para produção
2. Use um processo manager como PM2: `pm2 start app.js --name "mercado-livre-app"`
3. Configure um servidor web como Nginx ou Apache como proxy reverso
4. Configure HTTPS para segurança

## Suporte

Para obter suporte, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório do projeto.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para obter mais informações.
