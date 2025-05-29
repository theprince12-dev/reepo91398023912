# Configuração do Banco de Dados no King.host

Este documento contém instruções para finalizar a configuração do banco de dados no ambiente King.host.

## Passos já realizados

1. ✅ Criação do banco de dados MySQL no painel do King.host
2. ✅ Atualização do arquivo `config/config.json` com as credenciais corretas
3. ✅ Commit e push das alterações para o GitHub

## Próximos passos

O King.host irá atualizar o código do repositório com as novas configurações. Após a atualização, você precisará executar os seguintes comandos no terminal SSH do King.host:

### 1. Executar as migrações

```bash
cd /var/www/freteok
npm run migrate
```

### 2. Executar os seeders para popular a tabela de fretes

```bash
cd /var/www/freteok
npx sequelize-cli db:seed:all
```

### 3. Verificar se as tabelas foram criadas corretamente

Para verificar se as tabelas foram criadas corretamente, você pode executar:

```bash
cd /var/www/freteok
node check-db.js
```

### 4. Reiniciar a aplicação

Para garantir que a aplicação use as novas configurações de banco de dados:

```bash
cd /var/www/freteok
pm2 restart all
```

## Resolução de problemas comuns

### Se a migração falhar

Verifique os logs de erro e certifique-se de que o banco de dados está acessível com as credenciais fornecidas. Se necessário, teste a conexão com:

```bash
mysql -h mysql.freteok.com.br -u freteok -p
```
Quando solicitado, digite a senha: `freteok1`

### Se as tabelas não contiverem dados

Se as tabelas forem criadas mas não tiverem dados, você pode precisar copiar dados do ambiente de desenvolvimento para o de produção. Você pode fazer isso exportando os dados das tabelas críticas (como a tabela de fretes) e importando-os no banco de dados de produção.

### Se a aplicação continuar retornando ERRO_CALCULO_FRETE

Verifique se:
1. A tabela `fretes` existe e contém dados
2. As colunas na tabela correspondem às referenciadas no código, como `cnss_outros_7899`, `cnor_outros_79`, etc.
3. Os logs de erro da aplicação para obter mais detalhes sobre o problema

## Consultas úteis para depuração

```sql
-- Verificar se a tabela de fretes existe
SHOW TABLES;

-- Verificar as colunas na tabela de fretes
DESCRIBE fretes;

-- Verificar se há dados na tabela de fretes
SELECT COUNT(*) FROM fretes;

-- Verificar uma linha de dados específica
SELECT * FROM fretes LIMIT 1;
