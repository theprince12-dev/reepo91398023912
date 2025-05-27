// src/controllers/vendaController.js
const vendaService = require('../services/vendaService');
const authService = require('../services/authService'); // Necessário para obter token para chamadas em lote

class VendaController {
  // Apenas busca as vendas
  async getAllSales(req, res, next) {
    try {
      const { from, to } = req.query;
      console.log('getAllSales: parametros', { from, to });
      if (!from || !to) {
        return res.status(400).json({ message: 'É necessário adicionar a data inicial e final' });
      }
      // O serviço agora retorna { success, message, sales, total }
      const result = await vendaService.getAllSales(from, to);
      return res.status(200).json(result);
    } catch (error) {
      console.error('getAllSales: Erro ao obter vendas:', error);
      next(error); // Passa o erro para o middleware de tratamento de erros
    }
  }

  // Processa detalhes de uma única venda
  async processSaleDetails(req, res, next) {
    try {
      const { sale_id } = req.params;
      const accessToken = req.headers.authorization?.split(' ')[1] || await authService.getValidToken();
      if (!sale_id) {
        return res.status(400).json({ message: 'ID da venda é obrigatório.' });
      }
      const result = await vendaService.processSaleDetails(sale_id, accessToken);
      return res.status(200).json(result);
    } catch (error) {
      console.error(`processSaleDetails: Erro ao processar detalhes da venda ${req.params.sale_id}:`, error);
      next(error);
    }
  }

  // Valida frete de um único shipping_id
  async validateSaleShipping(req, res, next) {
    try {
      const { shipping_id } = req.params;
      const accessToken = req.headers.authorization?.split(' ')[1] || await authService.getValidToken();
      if (!shipping_id) {
        return res.status(400).json({ message: 'ID do envio é obrigatório.' });
      }
      const result = await vendaService.validateSaleShipping(shipping_id, accessToken);
      return res.status(200).json(result);
    } catch (error) {
      console.error(`validateSaleShipping: Erro ao validar frete para ${req.params.shipping_id}:`, error);
      next(error);
    }
  }

  // Processa detalhes de múltiplas vendas em lote
  async batchProcessSalesDetails(req, res, next) {
    try {
      const { sale_ids } = req.body; // Espera um array de sale_ids
      if (!sale_ids || !Array.isArray(sale_ids) || sale_ids.length === 0) {
        return res.status(400).json({ message: 'Array de IDs de venda é obrigatório.' });
      }
      const accessToken = req.headers.authorization?.split(' ')[1] || await authService.getValidToken();
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const saleId of sale_ids) {
        try {
          const result = await vendaService.processSaleDetails(saleId, accessToken);
          results.push({ sale_id: saleId, ...result });
          if (result.success) successCount++;
          else errorCount++;
        } catch (error) {
          results.push({ sale_id: saleId, success: false, message: error.message });
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para não sobrecarregar
      }
      
      return res.status(200).json({
        overall_success: errorCount === 0,
        message: `Processamento em lote concluído. ${successCount} sucessos, ${errorCount} falhas.`,
        results
      });
    } catch (error) {
      console.error('batchProcessSalesDetails: Erro no processamento em lote de detalhes:', error);
      next(error);
    }
  }

  // Valida fretes de múltiplos shipping_ids em lote
  async batchValidateSalesShipping(req, res, next) {
    try {
      const { shipping_ids } = req.body; // Espera um array de shipping_ids
      if (!shipping_ids || !Array.isArray(shipping_ids) || shipping_ids.length === 0) {
        return res.status(400).json({ message: 'Array de IDs de envio é obrigatório.' });
      }
      const accessToken = req.headers.authorization?.split(' ')[1] || await authService.getValidToken();

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const shippingId of shipping_ids) {
        try {
          const result = await vendaService.validateSaleShipping(shippingId, accessToken);
          results.push({ shipping_id: shippingId, ...result });
          if (result.success) successCount++;
          else errorCount++;
        } catch (error) {
          results.push({ shipping_id: shippingId, success: false, message: error.message });
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay
      }

      return res.status(200).json({
        overall_success: errorCount === 0,
        message: `Validação de frete em lote concluída. ${successCount} sucessos, ${errorCount} falhas.`,
        results
      });
    } catch (error) {
      console.error('batchValidateSalesShipping: Erro na validação em lote de fretes:', error);
      next(error);
    }
  }
}
module.exports = new VendaController();
