import { getSession } from "src/services/auth/session";

import { PropsWithChildren, ReactNode } from "react";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

type AuthorizationGateProps = {
  onUnauthorized: () => ReactNode;
  onUnauthenticated?: () => ReactNode;
  permissions?: string[];
  resourcePromises?: Promise<unknown>[];
};

export async function AuthorizationGate({
  children,
  // onUnauthorized,
  onUnauthenticated = () => <UnauthenticatedMessage />,
  // permissions,
  // resourcePromises,
}: PropsWithChildren<AuthorizationGateProps>) {
  const session = await getSession();
  if (!session?.token) {
    return onUnauthenticated();
  }
  const
  return children;
}
