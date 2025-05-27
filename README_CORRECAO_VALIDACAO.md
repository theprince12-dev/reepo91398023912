# Correção do Sistema de Validação de Fretes

## Problema Identificado

O principal problema identificado estava na validação de fretes para pacotes (is_pack = 1) e itens com múltiplas unidades. Especificamente:

1. Ao validar pacotes, o sistema estava usando o peso/dimensões do pacote completo em vez de calcular com base em cada item individual dentro do pacote.

2. Quando a API do Mercado Livre retornava dimensões vazias ou incompletas (`dimensions: null` ou dimensões parciais), o sistema não tinha um mecanismo eficaz para buscar essas dimensões de outras fontes.

3. O método `obterDimensoesItemDB` estava tentando buscar dimensões por `item_id` na tabela `DimensaoPacote`, mas esta tabela não possui esta coluna, somente `shipment_id`.

4. Em casos de pacotes (is_pack = 1), a validação tentava primeiro uma abordagem de peso total, e só verificava os itens individuais após detectar uma divergência, o que poderia levar a falsos positivos ou negativos.

## Solução Implementada

Foram implementadas as seguintes melhorias:

1. **Novo método `obterDimensoesItem`**:
   - Substitui o antigo `obterDimensoesItemDB`
   - Busca prioritariamente na API através do endpoint `/shipments/{id}/items`
   - Se não encontrar, tenta várias abordagens no banco de dados:
     - Por item_id (se a coluna existir)
     - Por shipment_id
     - Usando relacionamento item → detalhe_venda → shipment_id

2. **Método `salvarDimensoesItem`**:
   - Salva as dimensões obtidas da API para uso futuro
   - Atualiza registros existentes ou cria novos conforme necessário

3. **Atualização do fluxo para pacotes (is_pack = 1)**:
   - Para pacotes, prioriza diretamente a validação item a item
   - Busca todos os itens do pacote via API `/shipments/{id}/items`
   - Calcula o frete individual de cada item, multiplica pela quantidade
   - Soma para obter o frete total do pacote

4. **Melhoria no `calcularFreteIndividual`**:
   - Passa access_token e shipping_id para possibilitar busca de dimensões na API
   - Usa o método melhorado `obterDimensoesItem` para obter dimensões completas

5. **Consistência nas chamadas**:
   - Todas as chamadas ao método `calcularFreteIndividual` agora passam os parâmetros necessários para obter dimensões completas

## Alterações nos Arquivos

### `src/services/validacaoFreteService.js`

1. Substituição do método `obterDimensoesItemDB` pelo novo `obterDimensoesItem` mais robusto
2. Adição do método `salvarDimensoesItem` para persistência de dados
3. Modificação do método `calcularFreteIndividual` para aceitar parâmetros adicionais
4. Reestruturação do fluxo de validação para priorizar análise item a item em pacotes

### Novos scripts de teste

1. `testar-validacao-pacotes.js`: Ferramenta para validar pacotes com divergências
   - Identifica pacotes (is_pack = 1) com divergências
   - Executa a validação com o código corrigido
   - Exibe relatório de melhoria

## Como usar a solução

### Para testar a correção:

```bash
# Testar um pacote específico
node testar-validacao-pacotes.js --shipping=44343443680

# Testar os 10 pacotes divergentes mais recentes
node testar-validacao-pacotes.js --max=10
```

### Para validar manualmente fretes:

```bash
# Interface web:
# Acesse http://localhost:3000/freight-validation.html

# Linha de comando:
node testar-interface-validacao.js [shipping_id]
```

## Resultados Esperados

As melhorias implementadas devem resolver os seguintes problemas:

1. Pacotes (is_pack = 1) com validação incorreta devem passar a ter valores corretos
2. Itens com múltiplas unidades que antes apresentavam divergência devem ser corrigidos
3. Qualquer validação que anteriormente falhou por falta de dimensões deve agora encontrar esses dados através dos métodos melhorados

O status de validação deve mudar de `DIVERGENTE` para `OK_PACK` (pacotes) ou `OK_MULTI` (múltiplas unidades do mesmo item) nos casos corrigidos.

## Limitações Conhecidas

1. Se as dimensões não estiverem disponíveis nem na API nem no banco de dados, ainda pode haver divergências
2. Para validações manuais em casos excepcionais, use a interface web criada
