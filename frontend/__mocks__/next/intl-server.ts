export function mockGetTranslationsFor(map: Record<string, string>) {
  return async () => (key: string) => map[key] ?? key;
}