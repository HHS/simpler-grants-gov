'use client';
import React, { ReactElement, useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';
import { UserContext } from './useUser';
import { RequestError } from "./utils";
import { Session, UserFetcher, UserContextType, UserProviderProps, UserProviderState } from "./types";

/**
 * @ignore
 */
const userFetcher: UserFetcher = async (url) => {
  let response;
  try {
    response = await fetch(url);
    console.log(response);
  } catch {
    throw new RequestError(0); // Network error
  }
  if (response.status == 204) return undefined;
  if (response.ok) return response.json();
  throw new RequestError(response.status);
};

export default ({
  children,
  user: Session,
}: UserProviderProps): ReactElement<UserContextType> => {
  const [state, setState] = useState<UserProviderState>({ user: Session, isLoading: !Session });
  const checkSession = useCallback(async (): Promise<void> => {
    try {
      const user = await userFetcher('/api/auth/session') as Session;
      setState((previous) => ({ ...previous, user, isLoading: false, error: undefined }));
    } catch (error) {
      setState((previous) => ({ ...previous, error: error as Error }));
    }
  },[children]);

  useEffect((): void => {
    if (state.user) return;
    (async (): Promise<void> => {
      await checkSession();
      setState((previous) => ({ ...previous, isLoading: false }));
    })();
  }, [state.user]);

  const { user, error, isLoading } = state;
  const value = useMemo(() => ({ user, error, isLoading, checkSession }), [user, error, isLoading, checkSession]);
  console.log(value);
  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};
