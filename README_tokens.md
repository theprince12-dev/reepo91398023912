# Sistema de Persistência de Tokens

Este documento descreve a implementação de persistência de tokens no sistema, que permite que scripts e processos separados compartilhem tokens de autenticação do Mercado Livre.

## Problema Resolvido

Anteriormente, os tokens de autenticação eram armazenados apenas em memória (via NodeCache), o que fazia com que scripts independentes como `corrigir-pack-individual.js` não conseguissem acessar tokens válidos, resultando em erros como "Refresh token não encontrado".

A solução implementada cria uma tabela no banco de dados para armazenar tokens de autenticação, permitindo:
- Persistência entre reinicializações do servidor
- Compartilhamento entre diferentes scripts
- Gestão eficiente de expiração e renovação de tokens

## Configuração Inicial

Para configurar o sistema de persistência de tokens, execute:

```bash
node migrate-auth-tokens.js
```

Este comando:
1. Cria a tabela `auth_tokens` no banco de dados
2. Migra qualquer token existente no cache de memória para o banco
3. Prepara o sistema para uso contínuo

## Autenticação

Para obter um novo token após a configuração:

1. Inicie o servidor: `node app.js`
2. Acesse a página de autenticação: http://localhost:3000/auth.html
3. Complete o processo de autorização no Mercado Livre
4. O sistema salvará automaticamente o token no banco de dados

## Como Funciona

O sistema utiliza uma abordagem em camadas para gerenciar tokens:

1. Primeiro verifica o cache de memória (mais rápido)
2. Se não encontrar no cache, busca no banco de dados
3. Se o token estiver expirado ou inválido, tenta renovar automaticamente
4. Se a renovação falhar, solicita nova autenticação

## Estrutura da Tabela

A tabela `auth_tokens` armazena:

- `access_token`: Token de acesso para API
- `refresh_token`: Token para renovação automática
- `expires_at`: Data/hora de expiração
- `user_id`: ID do usuário (vendedor)
- `is_active`: Flag para controle de tokens ativos

## Uso em Scripts Independentes

Scripts como `corrigir-pack-individual.js` foram atualizados para:

1. Tentar obter o token via método padrão `authService.getValidToken()`
2. Em caso de falha, buscar diretamente na tabela `auth_tokens`
3. Fornecer mensagens claras em caso de falha na autenticação

## Solução de Problemas

Se encontrar problemas com autenticação:

1. Verifique se a migração foi executada: `node check-db.js` (deve mostrar a tabela `auth_tokens`)
2. Verifique se há tokens válidos: `SELECT * FROM auth_tokens WHERE is_active = true`
3. Se necessário, reauthentique acessando: http://localhost:3000/auth.html
4. Execute `node migrate-auth-tokens.js` para garantir que o esquema está atualizado

## Validação de Fretes com Pacotes

A correção implementada no serviço `validacaoFreteService.js` agora permite:
1. Cálculo preciso de fretes para pacotes (is_pack=1)
2. Determinação correta da coluna de frete para cada item individual
3. Verificação de categoria especial ao nível do item

Para processar pacotes com problemas:
```bash
node corrigir-pack-individual.js [ID_DO_SHIPMENT]
```

Se nenhum ID for fornecido, o script processará todos os pacotes com status `ERRO_PROCESSAMENTO_PACK`.
