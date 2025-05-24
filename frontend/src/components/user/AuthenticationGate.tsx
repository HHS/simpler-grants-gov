import { getSession } from "src/services/auth/session";

import { redirect } from "next/navigation";
import { ReactNode } from "react";

export async function AuthenticationGate({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session?.token) {
    return redirect("/");
  }
  return children;
}
