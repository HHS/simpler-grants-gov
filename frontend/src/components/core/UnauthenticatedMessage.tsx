import { useTranslations } from "next-intl";
import { Alert, GridContainer } from "@trussworks/react-uswds";

export const UnauthenticatedMessage = () => {
  const t = useTranslations("Errors");
  return (
    <GridContainer className="margin-top-4">
      <Alert type="error" heading={t("unauthenticated")} headingLevel="h4">
        {t("signInCTA")}
      </Alert>
    </GridContainer>
  );
};
