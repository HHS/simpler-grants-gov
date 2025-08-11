"use client";

import { useUser } from "src/services/auth/useUser";

import { useCallback, useEffect, useRef, useState } from "react";

export function ActivityMonitor() {
  const { user, refreshIfExpiring, refreshIfExpired, logoutLocalUser } =
    useUser();

  const [listening, setListening] = useState(false);
  const handlerRef = useRef<EventListener>(null);

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
      document.addEventListener("click", refreshTokenIfExpiringOrLogout);
      document.addEventListener("keydown", refreshTokenIfExpiringOrLogout);
      // setHandler(refreshTokenIfExpiringOrLogout);
      console.log("~~~ YES add handlers", !!refreshTokenIfExpiringOrLogout);
      setListening(true);
    }
  }, [refreshTokenIfExpiringOrLogout, listening]);

  const removeHandlers = useCallback(() => {
    console.log("~~~ REMOVING it???", listening, handlerRef.current);
    if (!listening) {
      console.log("~~~ not REMOVING it");
      return;
    }
    document.removeEventListener("click", handlerRef.current);
    document.removeEventListener("keydown", handlerRef.current);
    setListening(false);
    handlerRef.current = null;
  }, [listening]);

  useEffect(() => {
    if (!user || !user.token) {
      console.log("~~~ try REMOVING it");
      removeHandlers();
      return;
    }
    addHandlers();
  }, [user, addHandlers, removeHandlers]);

  useEffect(() => {
    if (refreshTokenIfExpiringOrLogout && !listening) {
      console.log("~~~ refreshing refresh function", listening);
      handlerRef.current = refreshTokenIfExpiringOrLogout;
    }
  }, [refreshTokenIfExpiringOrLogout, listening]);

  return null;
}
