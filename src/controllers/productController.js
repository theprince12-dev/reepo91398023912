// src/controllers/productController.js
const productService = require('../services/productService');

class ProductController {
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const product = await productService.getProductById(productId);
      res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  }
}
module.exports = new ProductController();