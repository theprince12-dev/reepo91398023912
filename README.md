# Mercado Livre Product App

Uma aplicação web para gerenciar produtos, vendas e validações de frete do Mercado Livre.

![Mercado Livre Product App](public/images/favicon.ico)

## Visão Geral

O Mercado Livre Product App é uma ferramenta completa para vendedores do Mercado Livre gerenciarem suas operações. A aplicação oferece uma interface amigável para visualizar vendas, gerenciar produtos, validar fretes e muito mais.

## Funcionalidades Principais

- **Autenticação OAuth**: Integração segura com a API do Mercado Livre
- **Dashboard**: Visão geral das atividades recentes e status da conta
- **Gerenciamento de Vendas**: Visualização e análise de vendas
- **Gerenciamento de Produtos**: Busca e visualização de detalhes de produtos
- **Validação de Frete**: Ferramentas para validar e otimizar custos de frete
- **Gerenciamento de Usuários**: Controle de acesso e permissões

## Tecnologias Utilizadas

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: SQLite (desenvolvimento), MySQL/PostgreSQL (produção)
- **Autenticação**: OAuth 2.0 com Mercado Livre API

## Capturas de Tela

(Adicione capturas de tela da aplicação aqui)

## Instalação Rápida

```bash
# Clone o repositório
git clone [URL_DO_REPOSITÓRIO]
cd mercado-livre-product-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Execute as migrações do banco de dados
npx sequelize-cli db:migrate

# Inicie a aplicação
npm start
```

Para instruções detalhadas de instalação e configuração, consulte o [Guia de Implantação](public/DEPLOYMENT.md).

## Uso

1. Acesse a aplicação em `http://localhost:3000`
2. Faça a autenticação com sua conta do Mercado Livre
3. Navegue pelas diferentes seções da aplicação:
   - Dashboard para uma visão geral
   - Vendas para gerenciar pedidos
   - Produtos para buscar e visualizar itens
   - Frete para validar custos de envio
   - Usuários para gerenciar permissões

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório do projeto.

---

Desenvolvido com ❤️ para vendedores do Mercado Livre
