"use client";

import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

const ServerErrorAlert = ({ callToAction }: { callToAction?: string }) => {
  const t = useTranslations("Errors");

  return (
    <Alert type="error" heading={t("heading")} headingLevel="h4">
      {t("generic_message")} {callToAction}
    </Alert>
  );
};

export default ServerErrorAlert;
