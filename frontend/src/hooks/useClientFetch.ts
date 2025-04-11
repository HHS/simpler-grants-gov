import { useUser } from "src/services/auth/useUser";

import { useCallback } from "react";

/*
  returns a function that you should use for 99% of client side requests to the Next API
  will automatically handle:
    * checking for token expiration
    * returning json data (by default, though you can opt out with the second parameter)
    * throwing errors on unsuccessful requests
 */
export const useClientFetch = <T>(
  errorMessage: string,
  jsonResponse = true,
) => {
  const { refreshIfExpired, refreshUser } = useUser();

  const fetchWithAuthCheck = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    await refreshIfExpired();
    const response = await fetch(url, options);
    if (response.status === 401) {
      await refreshUser();
      return response;
    }
    return response;
  };

  // when this function is used in a useEffect block the linter will want you to add it to the
  // dependency array. Unfortunately, right now, likely because this hook depends on useUser,
  // adding this a dependency will cause an infinite re-render loop. We should look into fixing this
  // but for the moment do not include this in dependency arrays. - DWS
  const clientFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<T> => {
      const response = await fetchWithAuthCheck(url, options);
      if (response.ok && response.status === 200) {
        if (jsonResponse) {
          const data = (await response.json()) as T;
          return data;
        }
        return response as T;
      } else {
        throw new Error(`${errorMessage}: ${response.status}`);
      }
    },
    [],
  );
  return {
    clientFetch,
  };
};
