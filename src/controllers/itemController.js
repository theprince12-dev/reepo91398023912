// src/controllers/itemController.js
const itemService = require('../services/itemService');

class ItemController {
  async getItem(req, res, next) {
    try {
       const { itemId } = req.params;
        const accessToken = req.headers.authorization?.split(' ')[1];
      const item = await itemService.getItemById(itemId, accessToken);
        res.json(item);
   } catch (error) {
         next(error);
  }
}
}
module.exports = new ItemController();