const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function isValidDateOnly(value: string) {
  const match = DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidMonth(value: string) {
  const match = MONTH_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function currentMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizeMonth(value: unknown) {
  return typeof value === "string" && isValidMonth(value)
    ? value
    : currentMonth();
}

export function parseDateOnly(value: string) {
  if (!isValidDateOnly(value)) {
    throw new Error("Invalid calendar date.");
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getMonthRange(month: string) {
  if (!isValidMonth(month)) {
    throw new Error("Invalid month.");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));

  return { start, end };
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}
