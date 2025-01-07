  // src/controllers/userController.js
  const userService = require('../services/userService');

  class UserController {
      async getUser(req, res, next) {
        try {
            const { user_id } = req.params;
            const user = await userService.obterDetalhesUsuario(user_id);
          res.json(user);
         } catch (error) {
            next(error);
         }
      }
  }

  module.exports = new UserController();