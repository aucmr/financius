/**
 * Format a number as Brazilian Real currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

/**
 * Format a Date object as a short locale date string (dd/mm/yyyy).
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

/**
 * Return the month name in Portuguese for a given month number (1–12).
 */
export function monthName(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}
