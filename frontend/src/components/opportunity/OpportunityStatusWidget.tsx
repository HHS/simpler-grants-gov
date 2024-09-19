import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

type Props = {
  opportunityData: Opportunity;
};

const OpportunityStatusWidget = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.status_widget");

  const opportunityStatus = opportunityData.opportunity_status;
  const opportunityCloseDate = opportunityData.summary.close_date;
  const opportunityArchiveDate = opportunityData.summary.archive_date;

  const statusTagFormatter = (
    status: string,
    closeDate: string,
    archiveDate: string,
  ) => {
    switch (status) {
      case "archived":
        return (
          <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("archived")}</strong>
              <span>{formatDate(archiveDate)}</span>
            </p>
          </div>
        );
      case "closed":
        return (
          <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("closed")}</strong>
              <span>{formatDate(closeDate)}</span>
            </p>
          </div>
        );
      case "posted":
        return (
          <>
            <div className="usa-tag bg-accent-warm-dark width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
              <p>
                <strong>{t("closing")}</strong>
                <span>{formatDate(closeDate)}</span>
              </p>
            </div>
            <div className="border radius-md border-base-lighter padding-x-2 margin-top-0">
              <p className="line-height-sans-5">{t("closing_warn")}</p>
            </div>
          </>
        );
      case "forecasted":
        return (
          <div className="usa-tag bg-base-dark border-radius-2 width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("forecasted")} </strong>
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={"usa-prose"}>
      {statusTagFormatter(
        opportunityStatus,
        opportunityCloseDate,
        opportunityArchiveDate,
      )}
    </div>
  );
};

export default OpportunityStatusWidget;
