import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";

import FullWidthAlert from "./FullWidthAlert";

const BetaAlert = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Beta_alert",
  });

  return (
    <div
      data-testid="beta-alert"
      className="desktop:position-sticky top-0 z-200"
    >
      <FullWidthAlert
        type="info"
        heading={
          <Trans
            t={t}
            i18nKey="alert_title"
            components={{
              LinkToGrants: (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ExternalRoutes.GRANTS_HOME}
                />
              ),
            }}
          />
        }
      >
        {t("alert")}
      </FullWidthAlert>
    </div>
  );
};

export default BetaAlert;
