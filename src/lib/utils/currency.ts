const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: string | number) {
  return brlFormatter.format(typeof value === "number" ? value : Number(value));
}
