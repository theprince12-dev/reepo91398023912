# Solução Implementada: Sistema de Autenticação e Usuário Atual

Este documento descreve a solução implementada para identificar o usuário atual logado, associar tokens de autenticação ao usuário e melhorar a segurança e escalabilidade do sistema.

## 1. Visão Geral da Solução

A solução implementada permite:

1. Obter o usuário atual logado através do endpoint `/users/me`
2. Associar tokens de autenticação (access_token e refresh_token) ao usuário correspondente
3. Gerenciar tokens de forma escalável usando um banco de dados robusto
4. Exibir informações do usuário na interface

## 2. Componentes Principais

### 2.1. Backend

#### AuthToken Model
- Armazena tokens de acesso e refresh tokens
- Possui campos para ID do usuário, data de expiração e status do token
- Implementa métodos para verificar validade e tempo restante
- Mantém associação com o modelo de usuário através de relacionamento

#### User Model
- Armazena dados do usuário (ID, nickname, nível, métricas)
- Associado aos tokens de autenticação

#### UserService
- Método `getCurrentUser()`: Obtém dados do usuário atual via API do Mercado Livre
- Método `createOrUpdateUser()`: Adiciona ou atualiza o usuário no banco de dados

#### AuthService
- Gerencia tokens de autenticação
- Renova automaticamente tokens expirados
- Mantém apenas um token ativo por usuário

#### UserController
- Endpoint `/users/me`: Retorna dados do usuário atual
- Endpoint `/users/:user_id`: Retorna dados de um usuário específico

### 2.2. Frontend

#### ApiService
- Método `getCurrentUser()`: Consulta o endpoint backend para obter o usuário atual

#### Config
- Configuração do endpoint para usuário atual

#### Interface de Usuário
- Página `users.html`: Exibe informações do usuário logado

## 3. Fluxo de Autenticação

1. O usuário se autentica via OAuth2 com o Mercado Livre
2. O sistema recebe o código de autorização e obtém access_token e refresh_token
3. O sistema consulta `/users/me` para obter o ID e nickname do usuário
4. O sistema salva ou atualiza os dados do usuário no banco de dados
5. Os tokens são associados ao usuário no banco de dados
6. Tokens anteriores do mesmo usuário são marcados como inativos

## 4. Gestão de Múltiplos Usuários

O sistema suporta múltiplos usuários, permitindo:

1. Cada usuário ter seu próprio conjunto de tokens
2. Renovação automática de tokens para cada usuário
3. Separação clara de dados entre diferentes usuários
4. Escalabilidade para adicionar mais usuários conforme necessário

## 5. Segurança e Boas Práticas

1. Tokens são armazenados no banco de dados (não em cookies ou localStorage)
2. Apenas um token ativo por usuário
3. Renovação automática gerenciada pelo backend
4. Verificação constante da validade do token

## 6. Endpoints Disponíveis

- `GET /api/users/me`: Retorna o usuário atualmente autenticado
- `GET /api/users/:user_id`: Retorna detalhes de um usuário específico

## 7. Exemplo de Uso

### Backend (Node.js)
```javascript
// Obter o usuário atual
const userInfo = await userService.getCurrentUser();
```

### Frontend (JavaScript)
```javascript
// Obter o usuário atual
const currentUser = await ApiService.getCurrentUser();

if (currentUser.success) {
  // Usar os dados do usuário
  const userId = currentUser.user.id;
  const nickname = currentUser.user.nickname;
  
  // Armazenar localmente se necessário
  localStorage.setItem('current_user_id', userId);
}
