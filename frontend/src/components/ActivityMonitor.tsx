"use client";

import { useUser } from "src/services/auth/useUser";

import { useCallback, useEffect, useState } from "react";

export function ActivityMonitor() {
  const { user, refreshIfExpiring, refreshIfExpired, logoutLocalUser } =
    useUser();
  // const [clickListener, setClickListener] = useState<EventListener | null>(
  //   null,
  // );
  // const [keyboardListener, setKeyboardListener] =
  //   useState<EventListener | null>(null);

  const [listening, setListening] = useState(false);

  // an issue is that the refresh that should happen to log the user out during testing is not doing that
  // because on the API side the login is still valid
  // Maybe we move the logout to somewhere else? but this shouldn't be an issue as long as expiration times match up with the API
  // can we adjust the API's expiration time for testing?
  // even with adjusting the API expiration we're still trying to log out after log out. I think the handlers are not being properly removed, we may need to go back to holding them in state?
  const refreshTokenIfExpiringOrLogout = useCallback(() => {
    console.log("~~~ doing it");
    refreshIfExpired()
      .then((expired) => {
        console.log("~~~ maybe logged out", expired);
        if (expired) {
          console.log("~~~ logging out local user");
          logoutLocalUser();
          return;
        }
        return refreshIfExpiring();
      })
      .catch((e) => {
        console.error("Error refreshing token in response to user activity", e);
      });
  }, [refreshIfExpired, refreshIfExpiring, logoutLocalUser]);

  const addHandlers = useCallback(() => {
    console.log("~~~ maybe add handlers");
    if (!listening) {
      console.log("~~~ YES add handlers");
      document.addEventListener("click", refreshTokenIfExpiringOrLogout);
      document.addEventListener("keydown", refreshTokenIfExpiringOrLogout);
      setListening(true);
    }
  }, [refreshTokenIfExpiringOrLogout, listening]);

  const removeHandlers = useCallback(() => {
    if (!listening) {
      console.log("~~~ not REMOVING it");
      return;
    }
    console.log("~~~ REMOVING it");
    document.removeEventListener("click", refreshTokenIfExpiringOrLogout);
    document.removeEventListener("keydown", refreshTokenIfExpiringOrLogout);
    setListening(false);
  }, [refreshTokenIfExpiringOrLogout, listening]);

  useEffect(() => {
    if (!user || !user.token) {
      console.log("~~~ try REMOVING it");
      removeHandlers();
      return;
    }
    addHandlers();
  }, [user, addHandlers, removeHandlers]);

  return null;
}
