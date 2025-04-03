import { getSession } from "src/services/auth/session";

import { getTranslations } from "next-intl/server";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export async function AuthenticationGate({ children }: PropsWithChildren) {
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
