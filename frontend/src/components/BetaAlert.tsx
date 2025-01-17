import { useTranslations } from "next-intl";
import { GridContainer, Alert as USWDSAlert } from "@trussworks/react-uswds";

type Props = {
  containerClasses?: string;
};

const BetaAlert = ({ containerClasses }: Props) => {
  const t = useTranslations("Beta_alert");
  const alert = t.rich("alert", {
    LinkToGrants: (content) => <a href="https://www.grants.gov">{content}</a>,
  });

  return (
    <div data-testid="beta-alert" className={containerClasses}>
      <GridContainer>
        <USWDSAlert
          type="warning"
          headingLevel="h2"
          heading={t("alert_title")}
          noIcon
        >
          {alert}
        </USWDSAlert>
      </GridContainer>
    </div>
  );
};

export default BetaAlert;
