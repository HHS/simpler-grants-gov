"use client";

import { useUser } from "src/services/auth/useUser";

import { useCallback, useEffect, useRef, useState } from "react";

// when a user is logged in, this will track all clicks and key presses and,
// on each action, if the user's auth token is expiring or expired, will refresh the
// token or log the user out accordingly
export function ActivityMonitor() {
  const { user, refreshIfExpiring, refreshIfExpired, logoutLocalUser } =
    useUser();

  const [listening, setListening] = useState(false);
  const handlerRef = useRef<EventListener>(null);

  const refreshTokenIfExpiringOrLogout = useCallback(() => {
    refreshIfExpired()
      .then((expired) => {
        if (expired) {
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
    if (!listening) {
      document.addEventListener("click", refreshTokenIfExpiringOrLogout);
      document.addEventListener("keydown", refreshTokenIfExpiringOrLogout);
      setListening(true);
    }
  }, [refreshTokenIfExpiringOrLogout, listening]);

  const removeHandlers = useCallback(() => {
    if (!listening) {
      return;
    }
    document.removeEventListener("click", handlerRef.current as EventListener);
    document.removeEventListener(
      "keydown",
      handlerRef.current as EventListener,
    );
    setListening(false);
    handlerRef.current = null;
  }, [listening]);

  // when logged in status changes, remove or add handlers
  useEffect(() => {
    if (!user || !user.token) {
      removeHandlers();
      return;
    }
    addHandlers();
    return () => {
      removeHandlers();
    };
  }, [user, addHandlers, removeHandlers]);

  // whenever we are not listening for activity, and the handler function has been updated
  // update the ref, so that we have the right reference ready when we want to remove the handlers later.
  // we do not want to pick up any changes made while listening, as those changes will not corerspond to the
  // handler that is actually attached to the document.
  // note that if we try to do this in addHandlers it somehow doesn't work right, given all of the dependencies involved.
  useEffect(() => {
    if (refreshTokenIfExpiringOrLogout && !listening) {
      handlerRef.current = refreshTokenIfExpiringOrLogout;
    }
  }, [refreshTokenIfExpiringOrLogout, listening]);

  return null;
}
