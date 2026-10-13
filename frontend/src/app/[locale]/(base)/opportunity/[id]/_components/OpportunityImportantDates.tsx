import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import {
  ADDITIONAL_ELIGIBILITY_INFO_ID,
  formatOptionalDate,
  isCloseDateMissing,
  OpportunityDetailItem,
  OpportunityDetailsCard,
  SECTION_HEADING_CLASSES,
} from "./OpportunityDetailItem";

type Props = {
  opportunityData: Pick<OpportunityDetail, "opportunity_status" | "summary">;
};

const ForecastedDates = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.importantDates");
  const notAvailable = useTranslations("OpportunityListing")("notAvailable");
  const { summary } = opportunityData;
  const dateOrFallback = (date: string | null) =>
    formatOptionalDate(date) || notAvailable;

  return (
    <>
      <OpportunityDetailItem label={t("forecastedPostDate")}>
        {dateOrFallback(summary.forecasted_post_date)}
      </OpportunityDetailItem>
      <OpportunityDetailItem label={t("forecastedCloseDate")}>
        {dateOrFallback(summary.forecasted_close_date)}
      </OpportunityDetailItem>
      <OpportunityDetailItem label={t("forecastedAwardDate")}>
        {dateOrFallback(summary.forecasted_award_date)}
      </OpportunityDetailItem>
      <OpportunityDetailItem label={t("forecastedProjectStartDate")}>
        {dateOrFallback(summary.forecasted_project_start_date)}
      </OpportunityDetailItem>
      <OpportunityDetailItem label={t("fiscalYear")}>
        {summary.fiscal_year ? summary.fiscal_year.toString() : notAvailable}
      </OpportunityDetailItem>
    </>
  );
};

const CloseDates = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.importantDates");
  const notAvailable = useTranslations("OpportunityListing")("notAvailable");
  const { opportunity_status: status, summary } = opportunityData;
  const closeDateDescription = summary.close_date_description;
  const closeDateMissing = isCloseDateMissing(opportunityData);

  return (
    <>
      {status === "archived" && (
        <OpportunityDetailItem label={t("archived")}>
          {formatOptionalDate(summary.archive_date) || notAvailable}
        </OpportunityDetailItem>
      )}
      <OpportunityDetailItem
        label={
          status === "closed" || status === "archived"
            ? t("closed")
            : t("closing")
        }
      >
        {closeDateMissing
          ? notAvailable
          : formatOptionalDate(summary.close_date)}
      </OpportunityDetailItem>
      {/* without a close date, the description is shown with the additional eligibility information */}
      {closeDateDescription &&
        (closeDateMissing ? (
          <p className="margin-y-1">
            <a className="usa-link" href={`#${ADDITIONAL_ELIGIBILITY_INFO_ID}`}>
              {t("seeAdditionalEligibilityInfo")}
            </a>
          </p>
        ) : (
          <p className="margin-y-1">{closeDateDescription}</p>
        ))}
    </>
  );
};

const OpportunityImportantDates = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.importantDates");

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      <OpportunityDetailsCard>
        {opportunityData.opportunity_status === "forecasted" ? (
          <ForecastedDates opportunityData={opportunityData} />
        ) : (
          <CloseDates opportunityData={opportunityData} />
        )}
      </OpportunityDetailsCard>
    </div>
  );
};

export default OpportunityImportantDates;
