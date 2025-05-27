# Correção do Cálculo de Frete para Pacotes com Múltiplos Itens

## Problema Identificado

Foi identificado que o sistema estava calculando incorretamente o valor do frete para pacotes que contêm múltiplos itens (MLBs). Especificamente:

- O cálculo era realizado apenas para o primeiro item do pacote
- Os demais itens eram ignorados no cálculo do frete
- Isso gerava divergências entre o valor correto que deveria ser cobrado e o que era efetivamente cobrado pela API do Mercado Livre

## Solução Implementada

### 1. Novo Método para Cálculo de Frete Total

Foi implementado o método `calcularFreteTotalPacote` no serviço `validacaoFreteService.js` que:

- Recebe todos os itens de um pacote e calcula o frete individual para cada um
- Considera a quantidade de cada item (multiplicando pelo frete unitário)
- Soma os valores calculados para obter o frete total do pacote
- Mantém um registro detalhado do cálculo para cada item

```javascript
async calcularFreteTotalPacote(itensDetalhados, colunaFrete, is_sulsudeste, is_fulfillment, sellerReputationLevelId, accessToken, shipping_id) {
    // Iteração sobre cada item
    let freteTotal = 0;
    const detalhesCalculo = [];
    
    for (const itemInfo of itensDetalhados) {
        // Calcula o frete para cada item
        const freteItem = await this.calcularFreteIndividual(...);
        
        // Multiplica pela quantidade
        const quantidade = itemInfo.quantity || 1;
        const freteItemTotal = freteItem * quantidade;
        freteTotal += freteItemTotal;
        
        // Registra detalhes do cálculo
        detalhesCalculo.push({
            item_id: item.id,
            frete_unitario: freteItem,
            quantidade: quantidade,
            subtotal: freteItemTotal
        });
    }
    
    return { valor: freteTotal, detalhes: detalhesCalculo };
}
```

### 2. Atualização do Método de Validação

O método `validarFretePorPacote` foi modificado para:

- Identificar quando um pacote contém múltiplos itens
- Utilizar o novo método `calcularFreteTotalPacote` para calcular o frete total nesses casos
- Manter o método tradicional como fallback
- Registrar informações detalhadas sobre o cálculo no banco de dados

```javascript
if (isPack && itensDetalhados.length > 1) {
    // Usar o novo método para calcular o frete total do pacote
    const resultadoFretePacote = await this.calcularFreteTotalPacote(...);
    
    if (resultadoFretePacote && resultadoFretePacote.valor > 0) {
        freteCalculado = resultadoFretePacote.valor;
        detalhesCalculoMultiplo = resultadoFretePacote.detalhes;
        statusPack = 'MULTIPLO';
    } else {
        // Se falhar, cair de volta para o método tradicional
        statusPack = 'FALLBACK';
    }
}
```

### 3. Registro Aprimorado de Validações

Foi aprimorado o salvamento das validações para:

- Incluir detalhes de cada item no cálculo (quando método múltiplo é usado)
- Adicionar uma tag ao status (`_MULTIPLO`) para identificar validações calculadas pelo novo método
- Facilitar a identificação de melhorias na precisão do cálculo

```javascript
// Dados para salvar
if (statusPack === 'MULTIPLO' && detalhesCalculoMultiplo) {
    // Adicionar tag ao status e salvar detalhes
    validacaoDados.status = `${statusFinal}_MULTIPLO`;
    validacaoDados.observacoes = JSON.stringify(detalhesCalculoMultiplo);
}
```

## Como Testar a Implementação

Foi criado um script específico para testar o novo método de cálculo:

```bash
node testar-validacao-pacote-multi.js
```

Este script:
1. Carrega validações existentes para comparação
2. Executa o método atualizado para um conjunto de pacotes com múltiplos itens
3. Compara o resultado anterior com o novo
4. Exibe detalhes do cálculo realizado para cada item do pacote
5. Mostra o resumo final com melhorias identificadas

## Benefícios da Solução

1. **Precisão**: Cálculo correto do frete para todos os itens do pacote
2. **Transparência**: Registro detalhado do cálculo item a item
3. **Robustez**: Fallback para o método tradicional quando necessário
4. **Facilidade de diagnóstico**: Status e observações específicas para pacotes múltiplos

Esta implementação corrige o problema identificado onde apenas o primeiro item de um pacote era considerado no cálculo do frete, resultando em valores mais precisos que correspondem melhor aos efetivamente cobrados pela API do Mercado Livre.
