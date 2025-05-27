# Validação de Pacotes - Problemas e Soluções

## Problemas Identificados

### 1. Acesso incorreto às dimensões do item

O sistema estava acessando as dimensões dos itens apenas através da propriedade `shipping.dimensions`, porém em vários casos as dimensões se encontram diretamente em `dimensions`.

Trecho problemático:
```javascript
const itemRealWeightKg = itemApiDetails.shipping?.dimensions?.weight ? Number((itemApiDetails.shipping.dimensions.weight / 1000).toFixed(4)) : (actual_weight_kg / primeiroItemInfo.quantity);
const itemVolWeightKg = calcularPesoVolumetricoKg(itemApiDetails.shipping?.dimensions?.length, itemApiDetails.shipping?.dimensions?.width, itemApiDetails.shipping?.dimensions?.height);
```

### 2. Falta de consideração do peso volumétrico na escolha da faixa de peso

Quando um item tem dimensões que resultam em um peso volumétrico significativo, esse valor não estava sendo adequadamente considerado para determinar a faixa de peso correta.

Exemplo: Um item com dimensões 25cm × 34cm × 7cm tem peso volumétrico de 0.9917kg (cerca de 992g), que deve ser enquadrado na faixa 501-1000g, mas estava sendo classificado incorretamente.

### 3. Multiplicação inadequada para múltiplas unidades

Quando o mesmo item aparece em múltiplas unidades na ordem, o sistema precisa multiplicar o valor de frete pelo número de unidades. Isto nem sempre estava sendo feito corretamente.

## Soluções Implementadas

### 1. Verificação dupla das dimensões

Agora o sistema verifica tanto `dimensions` quanto `shipping.dimensions`:

```javascript
const dimensions = itemApiDetails.dimensions || itemApiDetails.shipping?.dimensions || {};
```

### 2. Melhoria no tratamento de peso volumétrico

Adicionamos logs detalhados para facilitar o diagnóstico e melhoramos o cálculo do peso volumétrico:

```javascript
const itemVolWeightKg = calcularPesoVolumetricoKg(itemLength, itemWidth, itemHeight);
console.log(`validarFretePorPacote: Peso volumétrico calculado: ${itemVolWeightKg} kg (fórmula: ${itemLength} x ${itemWidth} x ${itemHeight} / 6000)`);
```

### 3. Correção para a multiplicação do valor de frete

Quando há múltiplas unidades do mesmo item, o valor de frete individual é multiplicado pelo número de unidades:

```javascript
const freteMultiplicado = Number((freteIndividualCalc * primeiroItemInfo.quantity).toFixed(2));
```

## Script de Correção

Foi criado um script `corrigir-validacao-pacotes.js` para recalcular validações existentes com o algoritmo corrigido:

```javascript
node corrigir-validacao-pacotes.js [shipping_id]
```

Se nenhum shipping_id for fornecido, o script processa as 10 primeiras validações divergentes encontradas no banco de dados.

## Exemplo de Correção

### Item de Teste MLB5253222788

- **Peso real:** 425g
- **Dimensões:** 25cm × 34cm × 7cm
- **Peso volumétrico:** 0.9917kg (992g)
- **Quantidade:** 2 unidades
- **Faixa de peso correta:** 501-1000g
- **Valor na coluna cnss_outros_7899:** R$ 42.90
- **Valor total (2 unidades):** R$ 85.80

Após a correção, o sistema calcula corretamente o frete para este item como R$ 85.80, que corresponde exatamente ao valor cobrado pela API.
