"use client";

// note that importing these individually allows us to mock them, otherwise mocks don't work :shrug:
import debounce from "lodash/debounce";
import noop from "lodash/noop";
import { userFetcher } from "src/app/api/userFetcher";
import { UserSession } from "src/services/auth/types";
import { UserContext } from "src/services/auth/useUser";
import { isSessionExpired } from "src/utils/authUtil";

import React, { useCallback, useEffect, useMemo, useState } from "react";

// if we don't debounce this call we get multiple requests going out on page load
const debouncedUserFetcher = debounce(
  () => userFetcher("/api/auth/session"),
  500,
  {
    leading: true,
    trailing: false,
  },
);

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localUser, setLocalUser] = useState<UserSession>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userFetchError, setUserFetchError] = useState<Error | undefined>();

  const getUserSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const fetchedUser = await debouncedUserFetcher();
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
