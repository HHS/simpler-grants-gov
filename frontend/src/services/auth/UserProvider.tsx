//    <UserProvider>
//      <Component {...pageProps} />
//    </UserProvider>
'use client';
import React, { ReactElement, useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';
import { UserContext } from './useUser';
import { RequestError } from "./utils";
import { UserFetcher, UserProfile, UserContextType, UserProviderProps, UserProviderState } from "./types";

/**
 * @ignore
 */
const userFetcher: UserFetcher = async (url) => {
  // TODO:

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new RequestError(0); // Network error
  }
  if (response.status == 204) return undefined;
  if (response.ok) return response.json();
  throw new RequestError(response.status);
};

export default ({
  children,
  user: initialUser,
  userEndpoint = process.env.API_URL || '/user',
  fetcher = userFetcher
}: UserProviderProps): ReactElement<UserContextType> => {
  const [state, setState] = useState<UserProviderState>({ user: initialUser, isLoading: !initialUser });

  const checkSession = useCallback(async (): Promise<void> => {
    // TODO:
    try {
      const user = await fetcher(userEndpoint);
      setState((previous) => ({ ...previous, user, error: undefined }));
    } catch (error) {
      setState((previous) => ({ ...previous, error: error as Error }));
    }
  }, [userEndpoint]);

  useEffect((): void => {
    if (state.user) return;
    (async (): Promise<void> => {
      await checkSession();
      setState((previous) => ({ ...previous, isLoading: false }));
    })();
  }, [state.user]);

  const { user, error, isLoading } = state;
  const value = useMemo(() => ({ user, error, isLoading, checkSession }), [user, error, isLoading, checkSession]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};
