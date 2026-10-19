"use client";

import { useTranslations } from "next-intl";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { LoginLink } from "src/components/core/LoginButton";

export const UnauthenticatedMessage = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer className="margin-top-4">
      <Alert type="error" heading={t("unauthenticated")} headingLevel="h4">
        {t("signInCTA")}
      </Alert>
      <div className="usa-button-group margin-top-2">
        <div className="usa-button-group__item">
          <LoginLink className="usa-button">{t("signIn")}</LoginLink>
        </div>
        <div className="usa-button-group__item">
          <LoginLink className="usa-button usa-button--outline">
            {t("createAccount")}
          </LoginLink>
        </div>
      </div>
    </GridContainer>
  );
};
