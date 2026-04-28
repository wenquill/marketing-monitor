/** Type-safe cast for node:sqlite query results. */
export function row<T>(v: unknown): T {
  return v as T;
}
