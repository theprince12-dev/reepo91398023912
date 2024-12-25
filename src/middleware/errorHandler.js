// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'TokenError') {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        details: err.message
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message
    });
  };
  
  module.exports = errorHandler;