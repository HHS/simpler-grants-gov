import { getSession } from "src/services/auth/session";

import { ReactNode } from "react";

import { UnauthenticatedMessage } from "./UnauthenticatedMessage";

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
