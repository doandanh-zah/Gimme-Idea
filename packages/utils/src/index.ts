export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
export function toIso(value: Date | string | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}
