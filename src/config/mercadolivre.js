// src/config/mercadoLivre.js
require('dotenv').config();

module.exports = {
    app_id: process.env.ML_APP_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    redirect_uri: process.env.ML_REDIRECT_URI,
    api_base_url: "https://api.mercadolibre.com"
};