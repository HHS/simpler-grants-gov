"use client";

import { noop } from "lodash";
import {
  UserContextType,
  UserFetcher,
  UserProviderProps,
  UserSession,
} from "src/services/auth/types";
import { UserContext } from "src/services/auth/useUser";
import { RequestError } from "src/services/auth/utils";
import { isSessionExpired } from "src/utils/authUtil";

import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const userFetcher: UserFetcher = async (url) => {
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    console.error("User session fetch network error", e);
    // not sure we need this error type
    throw new RequestError(0); // Network error
  }
  if (response.status === 204) return undefined;
  if (response.ok) return (await response.json()) as UserSession;
  throw new RequestError(response.status);
};

export default function UserProvider({
  children,
}: UserProviderProps): ReactElement<UserContextType> {
  const [localUser, setLocalUser] = useState<UserSession>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!localUser);
  const [userFetchError, setUserFetchError] = useState<Error | undefined>();

  const getUserSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const fetchedUser = await userFetcher("/api/auth/session");
      if (fetchedUser) {
        setLocalUser(fetchedUser);
        setUserFetchError(undefined);
        setIsLoading(false);
        return;
      }
      throw new Error("received empty user session");
    } catch (error) {
      setIsLoading(false);
      setUserFetchError(error as Error);
    }
  }, []);

  useEffect(() => {
    if (localUser && !isSessionExpired(localUser)) return;
    getUserSession().then(noop).catch(noop);
  }, [localUser, getUserSession]);

  const value = useMemo(
    () => ({ user: localUser, error: userFetchError, isLoading }),
    [localUser, userFetchError, isLoading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
