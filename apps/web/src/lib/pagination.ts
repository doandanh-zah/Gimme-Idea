export const catalogPageSize = 30;

export function catalogPage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}
