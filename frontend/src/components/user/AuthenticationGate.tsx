import { getSession } from "src/services/auth/session";

import { ReactNode } from "react";

import { RequireLogin } from "./RequireLogin";

export async function AuthenticationGate({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session?.token) {
    return <RequireLogin />;
  }
  return children;
}
