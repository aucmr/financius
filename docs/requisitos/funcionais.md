# Requisitos

Lista de requisitos do sistema Financius

## Requisitos Funcionais

- Cada despesa registrada deve ser marcada como compartilhada ou não. As desepsas compartilhadas devem ser contabilizadas para a divisão mensal dos gastos.
- A fórmula padrão para divisão dos gastos é somar todas as despesas compartilhadas do mês e dividir de forma propocional as receitas do casal. Porém a fórmula é editável e deve respeitar a decisão do casal. Por exemplo, dividir despesas igualitariamente ou por outra proporção esoclhida.
- Cada despesa deve ser registrada com uma categoria de AREA e uma respectiva subarea, e uma categoria de PERFIL
- Categorias de AREA e suas subcategorias:
  - Casa: Prestação, Seguro, Condomínio, IPTU, Energia, Água, Internet, TV, Faxina, Pets, Outros
  - Alimentação: Mercado, Restaurante, Outros
  - Saúde: Plano de Saúde, Dentista, Medicamentos, Outros
  - Transporte: IPVA, Seguro, Combustível, Manutenção, Uber, Outros
  - Pessoal: Esporte, Vestuário, Assinaturas, Outros
  - Filhos: Saúde, Escola, Vacina, Outros
  - Educação: Curso, Livro, Outros
  - Lazer: Clube, Confraternização, Passeio, Outros
  - Viagens: Passagem, Hospedagem, Alimentação, Transporte, Entretenimento, Outros
  - Outros: Extras Diários, Presentes, Doações, Tarifas

- Categorias de PERFIL:
  - CustoFixo
  - Conforto
  - Prazer
  - Conhecimento
  - Liberdade

## Notas da primeira implementação de despesas

- A competência mensal usa o campo `Expense.date`, que representa a data-calendário do lançamento.
- `creditCardTransactionDate` não é informado no formulário; esse campo será preenchido posteriormente pela importação de faturas.
- `userId` identifica quem cadastrou a despesa e é derivado da sessão autenticada.
- `responsibleUserId` identifica a pessoa responsável pela despesa e pode ser escolhido entre os membros do mesmo household.
- Os membros do household podem visualizar, editar e excluir as despesas do casal.
- A exclusão de despesas é definitiva nesta primeira versão.
- `shared` marca a despesa como participante do resumo mensal compartilhado. A fórmula editável e o rateio detalhado ainda não fazem parte desta entrega.
- `recurring` é apenas uma marcação visual nesta primeira versão e não gera lançamentos futuros.
- O catálogo de categorias e subcategorias é carregado pelo seed do Prisma; não há CRUD de categorias nesta etapa.
