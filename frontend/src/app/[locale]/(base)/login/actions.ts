"use server";

import { clearLoginRedirectFallback } from "src/services/auth/loginRedirectFallback";

export const clearLoginRedirectFallbackAction = async () => {
  await clearLoginRedirectFallback();
};
