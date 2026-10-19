import { getSession } from "src/services/auth/session";

import { ReactNode } from "react";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

// renders children only with a valid session, otherwise renders the shared signed-out state
// in place at the requested URL. getSession resolves null for missing or expired sessions.
// Authorization is handled separately by AuthorizationGate.
export async function AuthenticationGate({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session?.token) {
    return <UnauthenticatedMessage />;
  }
  return children;
}
