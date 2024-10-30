import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import ContentDisplayToggle from "../ContentDisplayToggle";

type Props = {
  opportunityData: Opportunity;
};

const CloseDateDescriptionDisplay = ({
  closeDateDescription = "",
}: {
  closeDateDescription: string;
}) => {
  if (!closeDateDescription) {
    return;
  }

  const t = useTranslations("OpportunityListing.description");
  if (closeDateDescription?.length < 120) {
    return (
      <div className="border radius-md border-base-lighter padding-x-2 margin-top-0">
        <p className="line-height-sans-5">{closeDateDescription}</p>
      </div>
    );
  }

  // close date description should not contain markup so no need to use splitMarkup
  const preSplit = closeDateDescription.substring(0, 120);
  const postSplit = closeDateDescription.substring(121);

  return (
    <div className="border radius-md border-base-lighter padding-x-2 margin-top-0">
      <p className="line-height-sans-5">{preSplit}...</p>
      <ContentDisplayToggle
        showCallToAction={t("show_description")}
        hideCallToAction={t("hide_summary_description")}
        positionButtonBelowContent={false}
      >
        <p className="line-height-sans-5">{postSplit}</p>
      </ContentDisplayToggle>
    </div>
  );
};

const OpportunityStatusWidget = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.status_widget");

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
          <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("archived")}</strong>
              <span>{formatDate(archiveDate) || "--"}</span>
            </p>
          </div>
        );
      case "closed":
        return (
          <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("closed")}</strong>
              <span>{formatDate(closeDate) || "--"}</span>
            </p>
          </div>
        );
      case "posted":
        return (
          <>
            <div className="usa-tag bg-accent-warm-dark width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
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
          <div className="usa-tag bg-base-dark border-radius-2 width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>{t("forecasted")}</strong>
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
