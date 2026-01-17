const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(Math.max(0, Math.round(amount)));
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(amount));
}

export function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${value.toFixed(1)}%`;
}

export function formatDateLabel(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatFullDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}
