
"use client";

import { useTranslations } from "next-intl";

import FullWidthAlert from "./FullWidthAlert";

const BetaAlert = () => {
  const t = useTranslations("Beta_alert")
  const heading = t.rich("alert_title", {
    LinkToGrants: (content) => (
      <a href="https://www.grants.gov">{content}</a>
    ),
  })

  return (
    <div
      data-testid="beta-alert"
      className="desktop:position-sticky top-0 z-200"
    >
      <FullWidthAlert type="info" heading={heading}>
        {t("alert")}
      </FullWidthAlert>
    </div>
  );
};

export default BetaAlert;
