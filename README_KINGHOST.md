# Guia de Implantação no King.host - Mercado Livre Product App

Este documento fornece instruções detalhadas para implantar a aplicação no ambiente de hospedagem King.host.

## Requisitos

- Conta no King.host com suporte a Node.js
- Conexão FTP configurada
- Domínio configurado para o site (freteok.com.br)

## Passos para implantação

### 1. Preparação dos arquivos

Os seguintes arquivos foram preparados especificamente para a implantação no King.host:

- **Procfile**: Instrui o servidor sobre como iniciar a aplicação Node.js
- **.htaccess**: Configura redirecionamentos e rotas para o servidor web
- **package.json**: Atualizado com scripts adequados para ambiente de produção

### 2. Configuração do GitHub para deploy automático

1. Acesse o painel de controle do King.host
2. Navegue até a seção "Gerenciar freteok.com.br" > "Publicação via GIT" > "Github"
3. Clique em "Adicionar repositório Github"
4. Configure as seguintes opções:
   - Aplicação no Github: theprince12-dev/reepo91398023912
   - Branch: master
   - Diretório para Publicação: /www/
   - Configurações: "Clonar automaticamente o repositório no diretório selecionado"
5. Clique em "HABILITAR"

### 3. Configuração de Variáveis de Ambiente

É necessário configurar as variáveis de ambiente no servidor do King.host:

```
# Configuração do Servidor
PORT=3000
NODE_ENV=production

# Configuração do Banco de Dados
DB_DIALECT=mysql
DB_HOST=seu_host_mysql
DB_NAME=seu_banco_de_dados
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Configuração da API do Mercado Livre
ML_APP_ID=seu_app_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
ML_REDIRECT_URI=https://freteok.com.br/api/auth/callback
```

### 4. Estrutura de arquivos no servidor

A estrutura de arquivos no servidor deve ser a seguinte:

```
/www/                        # Diretório raiz da hospedagem
├── public/                  # Arquivos estáticos servidos diretamente
│   ├── css/                 # Estilos CSS
│   ├── js/                  # Scripts JavaScript
│   ├── images/              # Imagens
│   └── *.html               # Páginas HTML
├── .htaccess                # Configurações do Apache
├── Procfile                 # Configurações para iniciar a aplicação Node.js
└── ...                      # Outros arquivos da aplicação
```

### 5. Execução das Migrações do Banco de Dados

Após o deploy, você precisa executar as migrações do banco de dados:

```bash
npm run migrate
```

### 6. Verificação da Implantação

1. Acesse https://freteok.com.br
2. Verifique se a página inicial carrega corretamente
3. Teste a autenticação com o Mercado Livre
4. Teste as funcionalidades principais da aplicação

## Solução de Problemas

### Erro 500 - Internal Server Error

Se você encontrar erros 500:
1. Verifique os logs do servidor no painel de controle do King.host
2. Certifique-se de que todas as variáveis de ambiente estão configuradas corretamente
3. Verifique se o arquivo .htaccess está configurado corretamente

### Erros de conexão com o banco de dados

Se você encontrar erros relacionados ao banco de dados:
1. Verifique se as credenciais do banco de dados estão corretas nas variáveis de ambiente
2. Certifique-se de que o banco de dados foi criado e as migrações foram executadas
3. Verifique os logs do servidor para mensagens de erro específicas

### Problemas com rotas da API

Se as chamadas à API não estiverem funcionando:
1. Verifique a configuração do .htaccess para garantir que as rotas /api/ estão sendo redirecionadas corretamente
2. Confirme que o serviço Node.js está em execução
3. Verifique os logs do servidor para mensagens de erro específicas

## Manutenção e Atualizações

Para atualizar a aplicação:

1. Faça as alterações necessárias no repositório GitHub
2. Faça commit e push das alterações para a branch master
3. O King.host detectará automaticamente as alterações e fará o deploy da nova versão

Para verificar o status do deploy, acesse o painel de controle do King.host na seção de Publicação via GIT.

## Considerações Importantes

- O servidor Node.js deve estar sempre em execução para que as chamadas à API funcionem corretamente
- O arquivo .htaccess é essencial para o funcionamento correto das rotas
- Certifique-se de que o domínio freteok.com.br está corretamente configurado para apontar para o servidor do King.host
