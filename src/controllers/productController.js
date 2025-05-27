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

  async getProductDescription(req, res) {
    try {
      const { productId } = req.params;
      const description = await productService.getProductDescription(productId);
      res.json(description);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductVariations(req, res) {
    try {
      const { productId } = req.params;
      const variations = await productService.getProductVariations(productId);
      res.json(variations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductImages(req, res) {
    try {
      const { productId } = req.params;
      const images = await productService.getProductImages(productId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
module.exports = new ProductController();
