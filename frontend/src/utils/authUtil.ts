import { UserSession } from "src/services/auth/types";

export const isSessionExpired = (userSession: UserSession): boolean => {
  // if we haven't implemented expiration yet
  // TODO: remove this once expiration is implemented in the token
  if (!userSession?.expiresAt) {
    return false;
  }
  return userSession.expiresAt > new Date(Date.now());
};
