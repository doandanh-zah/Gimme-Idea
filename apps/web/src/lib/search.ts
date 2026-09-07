export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd');
}

export function matchesSearch(text: string, query: string) {
  const haystack = normalizeSearchText(text);
  const terms = normalizeSearchText(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  return terms.every((term) => haystack.includes(term.length > 3 ? term.replace(/s$/, '') : term));
}
