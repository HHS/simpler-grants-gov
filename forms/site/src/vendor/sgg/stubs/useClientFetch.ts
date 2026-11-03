// Stand-in for frontend/src/hooks/useClientFetch: the form library has no Next API or user
// session, so requests (e.g. attachment uploads) fail with a clear message.
export const useClientFetch = <T>(errorMessage: string) => ({
  clientFetch: (url: string): Promise<T> =>
    Promise.reject(
      new Error(`${errorMessage}: ${url} is not available in the form library`),
    ),
});
