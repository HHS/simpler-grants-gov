/**
 * Mocks the provided environment variable values during the callback method and restores the orginal environment variables
 * after the callback is complete.
 *
 * @param overrides - key/value map of environment variable overrides to use within the callback function.
 * @param callback - function that will be called while the environment variables are set.
 */
export async function mockProcessEnv(
  overrides: { [key: string]: string },
  callback: () => Promise<void> | void,
) {
  const oldEnv = { ...process.env };
  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = value;
  });
  await callback();
  process.env = oldEnv;
}

class NoErrorThrownError extends Error {}

/*
  Jest doesn't like it when you put expect calls in catch blocks
  This is unavoidable, though, when testing route handlers that use Next's redirect functionality,
  as that implementation throws errors on redirect by design.
  When testing those sorts of functions, wrap the call to the route handler in an anonymous function and
  pass it into this wrapper, which will spit out the error as a return value
  see https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-conditional-expect.md
*/
export const wrapForExpectedError = async <TError = Error>(
  originalFunction: () => unknown,
): Promise<TError> => {
  try {
    await originalFunction();
    // since the original function should throw, should never hit this next line
    throw new NoErrorThrownError();
  } catch (e: unknown) {
    return e as TError;
  }
};

/*
  Useful when wanting to test with partial data.
*/
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
