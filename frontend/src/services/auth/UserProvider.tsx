"use client";

// note that importing these individually allows us to mock them, otherwise mocks don't work :shrug:
import debounce from "lodash/debounce";
import noop from "lodash/noop";
import { UserContext } from "src/services/auth/useUser";
import { UserProfile, UserSession } from "src/types/authTypes";

import React, { useCallback, useEffect, useMemo, useState } from "react";

// if we don't debounce this call we get multiple requests going out on page load
// not using clientFetch since we don't need to check the expiration here
// and also that'd create a circular dependency chain
const debouncedUserFetcher = debounce(
  async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (response.ok && response.status === 200) {
      const data = (await response.json()) as UserSession;
      return data;
    }
    throw new Error(`Unable to fetch user: ${response.status}`);
  },
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
  const [localUser, setLocalUser] = useState<UserProfile>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userFetchError, setUserFetchError] = useState<Error | undefined>();
  const [hasBeenLoggedOut, setHasBeenLoggedOut] = useState<boolean>(false);

  /*
    not running often enough at this point
    we can:

    * watch route changes
    * refresh user on each API response
    * try to figure out a way to respond to cookie changes
    *
    * on each response, check to see if there used to be a cookie, but now there isn't
    * if so, trigger a user refresh
    * on failed user refresh, show the toast?
    * is there a way to do this client side, and only as necessary, maybe per route? using next headers only runs in server components, and will opt any usage of it into dynamic rendering
    *
    * patch the fetch function? seems difficult
    * wrap the fetch function? maybe less difficult - on each resopnse, check the session cookie. If it was there on the request but not on the response it was erased by the middleware, and we can set something on the response body indicating the need for a user refresh? Or we can just trigger the user refresh from there? How can we make sure this only happens on the client though? Just by manual replacement?
    */

  const getUserSession = useCallback(async (): Promise<void> => {
    setHasBeenLoggedOut(false);
    setIsLoading(true);
    try {
      // there was custom logic around 204 responses in the original function
      // TBD if removing that will cause any problems
      const fetchedUser: UserSession = await debouncedUserFetcher();
      if (fetchedUser) {
        if (localUser?.token && !fetchedUser.token) {
          setHasBeenLoggedOut(true);
        }
        setLocalUser(fetchedUser);
        setUserFetchError(undefined);
        setIsLoading(false);
        return;
      }
      throw new Error("received empty user session");
    } catch (e) {
      setIsLoading(false);
      setUserFetchError(e as Error);
    }
  }, [localUser?.token]);

  // just remove the token
  const logoutLocalUser = useCallback(() => {
    setLocalUser({ ...(localUser as UserProfile), token: "" });
  }, [localUser]);

  // fetch user on hook startup
  useEffect(() => {
    if (localUser) return;
    getUserSession().then(noop).catch(noop);
  }, [localUser, getUserSession]);

  const value = useMemo(
    () => ({
      user: localUser,
      error: userFetchError,
      isLoading,
      refreshUser: getUserSession,
      hasBeenLoggedOut,
      logoutLocalUser,
    }),
    [
      localUser,
      userFetchError,
      isLoading,
      getUserSession,
      hasBeenLoggedOut,
      logoutLocalUser,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
