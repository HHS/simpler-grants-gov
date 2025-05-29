"use client";

import { useTranslations } from "next-intl";
import { redirect, useSearchParams } from "next/navigation";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export function RequireLogin() {
  const t = useTranslations("Errors");
  const searchParams = useSearchParams();

  if (searchParams.get("auth_logout") != null) {
    redirect("/");
  }
  return (
    <GridContainer className="margin-top-4">
      <Alert
        type="error"
        aria-label="login-required"
        heading={t("unauthenticated")}
        headingLevel="h4"
      >
        {t("signInCTA")}
      </Alert>
    </GridContainer>
  );
}
