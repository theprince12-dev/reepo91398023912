// src/services/specialCategoryService.js
const { SpecialCategory } = require('../../models');

class SpecialCategoryService {
  async isSpecialCategory(categoryId) {
      console.log('isSpecialCategory: Iniciando método', categoryId);
      try {
         // await sequelize.sync();
        const specialCategory = await SpecialCategory.findOne({
            where: { category_id: categoryId },
          });
            console.log('isSpecialCategory: Resultado da pesquisa na tabela:', specialCategory);
          return specialCategory ? 1 : 0;
      } catch (error) {
          console.error('isSpecialCategory: Erro ao verificar categoria especial:', error);
          return 0
      } finally {
         console.log('isSpecialCategory: Método finalizado', categoryId);
      }
  }
}

module.exports = new SpecialCategoryService();