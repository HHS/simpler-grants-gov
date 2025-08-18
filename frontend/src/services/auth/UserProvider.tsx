"use client";

// note that importing these individually allows us to mock them, otherwise mocks don't work :shrug:
import { useGetCookie } from "cookies-next";
import noop from "lodash/noop";
import { FeatureFlags } from "src/constants/defaultFeatureFlags";
import { UserContext } from "src/services/auth/useUser";
import { FEATURE_FLAGS_KEY } from "src/services/featureFlags/featureFlagHelpers";
import { debouncedUserFetcher } from "src/services/fetch/fetchers/clientUserFetcher";
import { UserProfile, UserSession } from "src/types/authTypes";
import { isExpired, isExpiring } from "src/utils/dateUtil";

import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function UserProvider({
  featureFlagDefaults,
  children,
}: {
  featureFlagDefaults: FeatureFlags;
  children: React.ReactNode;
}) {
  const getCookie = useGetCookie();
  const cookie = decodeURIComponent(getCookie(FEATURE_FLAGS_KEY) || "{}");
  const [localUser, setLocalUser] = useState<UserProfile>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userFetchError, setUserFetchError] = useState<Error | undefined>();
  const [hasBeenLoggedOut, setHasBeenLoggedOut] = useState<boolean>(false);
  const [defaultFeatureFlags] = useState<FeatureFlags>(featureFlagDefaults);
  const [userFeatureFlags, setUserFeatureFlags] = useState<FeatureFlags>({});

  // a workaround, as setting this in default state value results in hydration error
  useEffect(() => {
    const flagsFromCookie = JSON.parse(cookie) as FeatureFlags;
    setUserFeatureFlags(flagsFromCookie);
  }, [cookie]);

  const featureFlags = useMemo(() => {
    return {
      ...defaultFeatureFlags,
      ...userFeatureFlags,
    };
  }, [defaultFeatureFlags, userFeatureFlags]);

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

  const resetHasBeenLoggedOut = useCallback(
    () => setHasBeenLoggedOut(false),
    [],
  );

  // checks user token expiration time and refreshes the local user if it has expired
  // in order to perform a logout
  const refreshIfExpired = useCallback(async (): Promise<
    boolean | undefined
  > => {
    if (!localUser?.token) {
      return;
    }
    if (isExpired(localUser?.expiresAt)) {
      await getUserSession().then(noop).catch(noop);
      return true;
    }
  }, [localUser?.expiresAt, localUser?.token, getUserSession]);

  // if token is less than 10 mins from its expiration, refresh the user to get a token refresh
  const refreshIfExpiring = useCallback(async () => {
    if (isExpiring(localUser?.expiresAt)) {
      await getUserSession().then(noop).catch(noop);
      return true;
    }
  }, [localUser?.expiresAt, getUserSession]);

  const value = useMemo(
    () => ({
      user: localUser,
      error: userFetchError,
      isLoading,
      refreshUser: getUserSession,
      hasBeenLoggedOut,
      logoutLocalUser,
      refreshIfExpired,
      refreshIfExpiring,
      resetHasBeenLoggedOut,
      featureFlags,
      userFeatureFlags,
      defaultFeatureFlags,
    }),
    [
      localUser,
      userFetchError,
      isLoading,
      getUserSession,
      hasBeenLoggedOut,
      logoutLocalUser,
      refreshIfExpired,
      refreshIfExpiring,
      resetHasBeenLoggedOut,
      featureFlags,
      userFeatureFlags,
      defaultFeatureFlags,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
