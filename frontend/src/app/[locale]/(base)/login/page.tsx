import { getLoginRedirectFallback } from "src/services/auth/loginRedirectFallback";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";
import { clearLoginRedirectFallbackAction } from "./actions";

export default async function Login() {
  // server-side fallback destination; PostAuthRedirect validates it and uses it
  // only when sessionStorage has no valid destination
  const fallbackDestination = await getLoginRedirectFallback();
  return (
    <PostAuthRedirect
      checkPiv={true}
      trackDestination={true}
      fallbackDestination={fallbackDestination}
      clearFallbackDestination={clearLoginRedirectFallbackAction}
    />
  );
}
