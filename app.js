// app.js
const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const errorHandler = require('./src/middleware/errorHandler');
const sequelize = require('./src/config/database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.use(errorHandler);


const PORT = process.env.PORT || 3000;

async function startServer(){
      try {
           await sequelize.sync({alter:true})
           console.log('Banco de dados sincronizado com sucesso!');
           app.listen(PORT, () => {
              console.log(`Servidor rodando na porta ${PORT} - http://localhost:${PORT}`);
          });
      } catch (error) {
          console.error('Erro ao sincronizar o banco de dados:', error);
    }
}

startServer();