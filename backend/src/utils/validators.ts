/**
 * Validates a Google Play store URL and extracts the package ID.
 * Returns the package ID string, or null if the URL is invalid.
 */
export function parsePlayUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('play.google.com')) return null;
    if (!parsed.pathname.startsWith('/store/apps/details')) return null;
    const id = parsed.searchParams.get('id');
    if (!id || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(id)) return null;
    return id;
  } catch {
    return null;
  }
}
