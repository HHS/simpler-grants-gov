import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";
import { findFirstWhitespace } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import { ForecastOpportunityItem } from "./ForecastOpportunityItem";

type Props = {
  opportunityData: OpportunityDetail;
};

const CloseDateDescriptionDisplay = ({
  closeDateDescription = "",
}: {
  closeDateDescription: string;
}) => {
  const t = useTranslations("OpportunityListing.description");
  if (!closeDateDescription) {
    return;
  }

  if (closeDateDescription?.length < 150) {
    return (
      <div className="border radius-md border-base-lighter padding-x-2">
        <p className="line-height-sans-5">{closeDateDescription}</p>
      </div>
    );
  }

  // close date description should not contain markup so no need to use splitMarkup
  const splitAt = findFirstWhitespace(closeDateDescription, 120);
  const preSplit = closeDateDescription.substring(0, splitAt);
  const postSplit = closeDateDescription.substring(splitAt + 1);

  return (
    <div className="border radius-md border-base-lighter padding-x-2">
      <p className="line-height-sans-5">{preSplit}...</p>
      <ContentDisplayToggle
        showCallToAction={t("showDescription")}
        hideCallToAction={t("hideSummaryDescription")}
        positionButtonBelowContent={false}
      >
        <p className="line-height-sans-5">{postSplit}</p>
      </ContentDisplayToggle>
    </div>
  );
};

const OpportunityStatusWidget = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.statusWidget");

  const opportunityStatus = opportunityData.opportunity_status;
  const opportunityCloseDate = opportunityData.summary.close_date;
  const opportunityArchiveDate = opportunityData.summary.archive_date;

  const statusTagFormatter = (
    status: string,
    closeDate: string | null,
    archiveDate: string | null,
  ) => {
    switch (status) {
      case "archived":
        return (
          <div className="usa-tag bg-base-lighter text-ink radius-2 border-base-lightest radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("archived")}</strong>
              <span>{formatDate(archiveDate) || "--"}</span>
            </p>
          </div>
        );
      case "closed":
        return (
          <div className="usa-tag bg-base-lighter text-ink radius-2 border-base-lightest radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("closed")}</strong>
              <span>{formatDate(closeDate) || "--"}</span>
            </p>
          </div>
        );
      case "posted":
        return (
          <>
            <div className="usa-tag bg-accent-warm-dark radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
              <p>
                <strong>{t("closing")}</strong>
                <span>{formatDate(closeDate) || "--"}</span>
              </p>
            </div>
            <CloseDateDescriptionDisplay
              closeDateDescription={
                opportunityData.summary.close_date_description || ""
              }
            />
          </>
        );
      case "forecasted":
        return (
          <div>
            <div className="usa-tag bg-base-dark radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
              <p>
                <strong>{t("forecasted")}</strong>
              </p>
            </div>
            <div className="border border-base-lighter radius-sm">
              <ForecastOpportunityItem detail={opportunityData} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div data-testid="opportunity-status-widget">
      {statusTagFormatter(
        opportunityStatus,
        opportunityCloseDate,
        opportunityArchiveDate,
      )}
    </div>
  );
};

export default OpportunityStatusWidget;
