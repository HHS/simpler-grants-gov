import { getSession } from "src/services/auth/session";

import { getTranslations } from "next-intl/server";
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
    return (
      <GridContainer className="margin-top-4">
        <Alert type="error" heading={t("unauthenticated")} headingLevel="h4">
          {t("signInCTA")}
        </Alert>
      </GridContainer>
    );
  }
  return children;
}
