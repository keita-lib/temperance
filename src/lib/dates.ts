const ISO_DATE_LENGTH = 10;

export function getTodayInputValue() {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH);
}

export function isoToDateInput(iso: string | null | undefined) {
  if (!iso) return getTodayInputValue();
  return iso.slice(0, ISO_DATE_LENGTH);
}

export function inputDateToIso(dateString: string, reference?: Date) {
  if (!dateString) {
    return new Date().toISOString();
  }
  const base = reference ? new Date(reference) : new Date();
  const [year, month, day] = dateString.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    return new Date().toISOString();
  }
  base.setFullYear(year, month - 1, day);
  base.setHours(12, 0, 0, 0);
  return base.toISOString();
}
