import { getSession } from "src/services/auth/session";

import { ReactNode, Suspense } from "react";

import { RequireLogin } from "./RequireLogin";
import Loading from "src/components/Loading";
import { getTranslations } from "next-intl/server";

export async function AuthenticationGate({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("LogoutSession")
  const session = await getSession();
  if (!session?.token) {
    return (
      <Suspense fallback={<Loading message={t("loading")} />}>
        <RequireLogin />
      </Suspense>
    )
  }
  return children;
}
