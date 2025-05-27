# Implementação de Validação de Frete para Pacotes (is_pack=1)

## Problema Resolvido

Quando um envio contém múltiplos itens diferentes ou múltiplas unidades do mesmo item (is_pack=1), o Mercado Livre calcula o frete de forma diferente:

1. Para múltiplas unidades do mesmo item: Os custos de frete são multiplicados pela quantidade
2. Para múltiplos itens diferentes: Cada item é calculado individualmente e depois somado

Esta implementação trata especificamente o segundo caso, onde é necessário consumir o endpoint:
```
https://api.mercadolibre.com/shipments/$SHIPMENT_ID/items
```

## Lógica Implementada

A implementação segue os seguintes passos:

1. **Detecção de Pacotes**: Identifica quando um envio tem `is_pack=1`
2. **Obtenção dos Itens**: Chama a API para obter todos os itens individuais do pacote
3. **Cálculo Individual**: Para cada item do pacote:
   - Obtém dimensões e peso do item
   - Calcula o frete individual aplicando a tabela correta
4. **Soma dos Fretes**: Soma todos os fretes individuais calculados
5. **Validação**: Compara o valor calculado com o efetivamente cobrado pela API

## Novas Funcionalidades no Código

### Novas Funções em validacaoFreteService.js

- **obterItensPorShipment(shipmentId, accessToken)**
  - Consulta a API do Mercado Livre para obter todos os itens de um envio
  - Retorna um array com os dados de cada item

- **calcularFreteIndividual(item, colunaFrete, is_sulsudeste, is_fulfillment, sellerReputationLevelId)**
  - Calcula o frete para um item individual
  - Leva em consideração peso real, peso volumétrico, e aplica a coluna de frete correta

### Modificações no Método validarFretePorPacote

- Verifica se `is_pack=1`
- Chama `obterItensPorShipment` para obter itens
- Processa cada item com `calcularFreteIndividual`
- Soma os valores e compara com `freteCobradoAPI`
- Gera status específicos: `OK_PACK`, `DIVERGENTE_PACK`, etc.

## Scripts de Utilidade

### validar-shipment-pack.js

Permite validar um shipment específico que tenha is_pack=1:

```bash
node validar-shipment-pack.js <shipping_id>
```

Exemplo:
```bash
node validar-shipment-pack.js 44343443680
```

### reprocessar-pacotes.js

Reprocesa múltiplos pacotes em lote para gerar estatísticas:

```bash
node reprocessar-pacotes.js [quantidade_max] [delay_ms]
```

Exemplo (processa até 20 pacotes com 3 segundos de intervalo):
```bash
node reprocessar-pacotes.js 20 3000
```

## Status de Validação Relacionados a Pacotes

- `OK_PACK`: O frete calculado para o pacote coincide com o cobrado pela API
- `DIVERGENTE_PACK`: O frete calculado para o pacote é diferente do cobrado pela API
- `ERRO_PACK_SEM_ITENS`: Não foi possível obter itens do pacote via API
- `ERRO_PROCESSAMENTO_PACK`: Ocorreu um erro durante o processamento do pacote

## Considerações Adicionais

1. **Desempenho**: A validação de pacotes exige chamadas adicionais à API, o que pode tornar o processo mais lento
2. **Limites de API**: Tenha cuidado com os limites de requisições da API do Mercado Livre
3. **Monitoramento**: É recomendável monitorar os logs para identificar possíveis padrões em divergências de pacotes
