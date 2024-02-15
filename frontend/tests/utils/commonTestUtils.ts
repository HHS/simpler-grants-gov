/**
 * Mocks the provided environment variable values during the callback method and restores the orginal environment variables
 * after the callback is complete.
 *
 * @param overrides - key/value map of environment variable overrides to use within the callback function.
 * @param callback - function that will be called while the environment variables are set.
 */
export async function mockProcessEnv(
  overrides: { [key: string]: string },
  callback: () => Promise<void> | void
) {
  const oldEnv = { ...process.env };
  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = value;
  });
  await callback();
  process.env = oldEnv;
}
