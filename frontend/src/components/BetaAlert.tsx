import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { GridContainer, Alert as USWDSAlert } from "@trussworks/react-uswds";

type BetaAlertProps = {
  containerClasses?: string;
  heading?: string;
  alertMessage?: string | ReactNode;
};

const BetaAlert = ({
  containerClasses,
  heading,
  alertMessage,
}: BetaAlertProps) => {
  const t = useTranslations("Beta_alert");
  const defaultAlertMessage = t.rich("alert", {
    LinkToGrants: (content) => <a href="https://www.grants.gov">{content}</a>,
  });

  return (
    <div data-testid="beta-alert" className={containerClasses}>
      <GridContainer>
        <USWDSAlert
          type="warning"
          headingLevel="h2"
          heading={heading || t("alert_title")}
          noIcon
        >
          {alertMessage || defaultAlertMessage}
        </USWDSAlert>
      </GridContainer>
    </div>
  );
};

export default BetaAlert;
