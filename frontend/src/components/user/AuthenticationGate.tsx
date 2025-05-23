import { getSession } from "src/services/auth/session";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function AuthenticationGate({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const t = await getTranslations("Errors");
  if (!session?.token) {
    return redirect("/");
  }
  return children;
}
