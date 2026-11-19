"use server";

import { clearLoginRedirectFallback } from "src/services/auth/loginRedirectFallback";

// called by PostAuthRedirect once it has chosen the post-sign-in destination
export const clearLoginRedirectFallbackAction = async () => {
  await clearLoginRedirectFallback();
};
