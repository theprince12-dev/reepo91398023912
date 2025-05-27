// app.js
const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api'); // Confirme se este caminho está correto
const apiSimplificadoRoutes = require('./src/routes/api-simplificado'); // Rotas simplificadas para validação de frete
const api2025Routes = require('./src/routes/api-2025'); // Rotas para o modelo 2025
const errorHandler = require('./src/middleware/errorHandler'); // Confirme se este caminho está correto
// const sequelize = require('./src/config/database'); // <<< LINHA REMOVIDA

const app = express();

// Middlewares básicos
app.use(express.json()); // Para parsear JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Para servir arquivos estáticos (CSS, JS do frontend, etc.)

// Rotas da API
app.use('/api', apiRoutes);

// Adicionar as rotas simplificadas para validação de frete
app.use('/api/simplificado', apiSimplificadoRoutes);

// Adicionar as rotas para o modelo 2025
app.use('/api/2025', api2025Routes);

// Middleware de tratamento de erros (deve vir depois das rotas)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Removida a função startServer e a chamada sequelize.sync()
// A conexão com o banco de dados agora é gerenciada pelo Sequelize
// quando os modelos são importados e usados (via models/index.js).
// A estrutura do banco (tabelas) deve ser gerenciada por MIGRAÇÕES.

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} - http://localhost:${PORT}`);
    // Mensagem opcional para clareza
    console.log('Inicialização do Sequelize e conexão com DB gerenciados via models/index.js');
    console.log('Certifique-se de que as migrações do banco de dados foram executadas.');
});

// Exportar o app pode ser útil para testes
// module.exports = app; // Descomente se precisar exportar para testes
