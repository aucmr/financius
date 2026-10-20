# Requisitos

Lista de requisitos do sistema Financius

## Requisitos Funcionais

- Cada despesa registrada deve ser marcada como compartilhada ou não. As desepsas compartilhadas devem ser contabilizadas para a divisão mensal dos gastos.
- A fórmula padrão para divisão dos gastos é somar todas as despesas compartilhadas do mês e dividir de forma propocional as receitas do casal. Porém a fórmula é editável e deve respeitar a decisão do casal. Por exemplo, dividir despesas igualitariamente ou por outra proporção esoclhida.
- Cada despesa deve ser registrada com uma categoria de AREA e uma respectiva subarea, e uma categoria de PERFIL
- Cada household possui seu próprio catálogo de categorias de despesa. O catálogo inicial é copiado para households existentes e provisionado para novos; alterações de um casal não afetam outros.
- As categorias podem ser cadastradas, editadas, reordenadas e arquivadas. A ordem das categorias ativas é compartilhada pelos seletores, pela importação e pelos grupos da tela de despesas.
- Arquivar uma categoria ou subcategoria preserva as despesas existentes e impede novas classificações com ela. Ao editar uma despesa antiga, sua classificação arquivada pode ser mantida; sugestões de importação usam somente categorias ativas.
- Categorias podem ter cor e ícone personalizados. Somente categorias de AREA possuem subcategorias.
- Categorias de AREA e suas subcategorias iniciais:
  - Alimentação: Mercado, Restaurante, Outros
  - Casa: Prestação, Seguro, Condomínio, IPTU, Energia, Água, Internet, TV, Faxina, Pets, Outros
  - Educação: Curso, Livro, Outros
  - Filhos: Saúde, Escola, Vacina, Outros
  - Lazer: Clube, Confraternização, Passeio, Outros
  - Outros: Extras Diários, Presentes, Doações, Tarifas
  - Pessoal: Esporte, Vestuário, Assinaturas, Outros
  - Saúde: Plano de Saúde, Dentista, Medicamentos, Outros
  - Transporte: IPVA, Seguro, Combustível, Manutenção, Uber, Outros
  - Viagens: Passagem, Hospedagem, Alimentação, Transporte, Entretenimento, Outros

- Categorias de PERFIL:
  - Conhecimento
  - Conforto
  - CustoFixo
  - Liberdade
  - Prazer

## Notas da primeira implementação de despesas

- A competência mensal usa o campo `Expense.date`, que representa a data-calendário do lançamento.
- `creditCardTransactionDate` não é informado no formulário; esse campo será preenchido posteriormente pela importação de faturas.
- `userId` identifica quem cadastrou a despesa e é derivado da sessão autenticada.
- `responsibleUserId` identifica a pessoa responsável pela despesa e pode ser escolhido entre os membros do mesmo household.
- Os membros do household podem visualizar, editar e excluir as despesas do casal.
- A exclusão de despesas é definitiva nesta primeira versão.
- `shared` marca a despesa como participante do resumo mensal compartilhado. A fórmula editável e o rateio detalhado ainda não fazem parte desta entrega.
- `recurring` é apenas uma marcação visual nesta primeira versão e não gera lançamentos futuros.
- O menu lateral oferece o gerenciamento do catálogo do casal, incluindo subcategorias de AREA, ordem, arquivamento e aparência visual.

## Importação de faturas e extratos

- A aplicação aceita arquivos CSV dos formatos XP, BTG e Banco do Brasil (BB). O delimitador de vírgula ou ponto e vírgula é detectado automaticamente; arquivos UTF-8, UTF-16 com BOM e Windows-1252 são aceitos.
- XP e BTG representam faturas de cartão. A competência da fatura é informada manualmente no início do fluxo e é persistida em `Expense.date`; a data original da compra é persistida em `creditCardTransactionDate`.
- BB representa extrato bancário. A data de cada lançamento é usada em `Expense.date`, sem `creditCardTransactionDate`.
- Na v1 são importados somente lançamentos de saída do BB. Créditos, pagamentos de fatura e linhas de saldo são ignorados conforme o tipo identificado no arquivo.
- Valores de cartão preservam o sinal original, incluindo estornos negativos. Débitos do BB são normalizados para valores positivos. A criação manual continua exigindo valor positivo; a edição permite manter um estorno negativo importado.
- Valores importados são convertidos para centavos sem aritmética decimal de ponto flutuante; valores não nulos não podem ser rejeitados por erro de precisão, enquanto zero continua inválido.
- Cada arquivo tem um responsável único, escolhido no setup e aplicado a todas as linhas. O servidor valida que o responsável pertence ao household autenticado.
- A leitura do arquivo não grava dados. Depois do parsing, cada linha válida passa por uma revisão obrigatória antes de ser confirmada ou pulada.
- Durante a revisão, é possível voltar à despesa anterior. Os campos e a decisão são preservados; confirmar ou pular novamente substitui a decisão anterior da linha sem duplicá-la no lote.
- O histórico do household pode gerar sugestões por descrição exata ou similaridade. A sugestão serve apenas como pré-preenchimento; categoria de área, subcategoria, categoria de perfil, responsável, observações e marcações podem ser revisados antes da confirmação.
- Duplicidades são exibidas como aviso por linha, usando fingerprint da linha e combinação de descrição, valor e datas. A pessoa pode confirmar a importação da linha duplicada ou pulá-la; uma duplicidade não bloqueia as demais linhas do arquivo.
- O sistema registra um lote de importação com arquivo, origem, fingerprint do arquivo, competência, status e contadores de linhas importadas, ignoradas, puladas e com falha. Cada despesa importada mantém o lote, número da linha, fingerprint e metadados técnicos de origem.
- A listagem mensal identifica despesas importadas e, para lançamentos de cartão, mostra a data original da compra separada da competência mensal.
- Limitações da v1: somente os três layouts CSV suportados são reconhecidos; a competência de XP/BTG depende da informação manual; a revisão é individual por linha; não há importação de receitas nem sincronização automática com instituições financeiras.
