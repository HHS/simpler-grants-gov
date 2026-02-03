/**
 * Asserts that a harness-triggered redirect occurred.
 */
export function expectHarnessRedirect(
  error: unknown,
  destination: string,
): void {
  const message = error instanceof Error ? error.message : "";
  expect(message).toBe(`__HARNESS_REDIRECT__:${destination}`);
}
