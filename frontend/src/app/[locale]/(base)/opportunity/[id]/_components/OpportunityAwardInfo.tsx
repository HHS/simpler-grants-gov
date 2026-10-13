import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";

import {
  OpportunityDetailItem,
  OpportunityDetailsCard,
  SECTION_HEADING_CLASSES,
} from "./OpportunityDetailItem";

type Props = {
  opportunityData: BaseOpportunity;
};

// API enum values such as "cooperative_agreement" display as "Cooperative agreement"
const formatEnumValue = (value: string) => {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const OpportunityAwardInfo = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.awardInfo");
  const notAvailable = useTranslations("OpportunityListing")("notAvailable");
  const { summary } = opportunityData;

  const currencyOrFallback = (amount: number | null) =>
    amount === null ? notAvailable : formatCurrency(amount) || "$0";

  const fundingInstruments = summary.funding_instruments?.length
    ? summary.funding_instruments.map(formatEnumValue).join(", ")
    : notAvailable;
  const fundingActivities = summary.funding_categories ?? [];

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      <OpportunityDetailsCard>
        <OpportunityDetailItem label={t("programFunding")}>
          {currencyOrFallback(summary.estimated_total_program_funding)}
        </OpportunityDetailItem>
        <OpportunityDetailItem label={t("expectedAwards")}>
          {summary.expected_number_of_awards ?? notAvailable}
        </OpportunityDetailItem>
      </OpportunityDetailsCard>
      <div className="grid-row grid-gap-2 margin-top-2">
        <div className="grid-col-6">
          <OpportunityDetailsCard className="height-full">
            <p className="margin-y-1 text-bold">{t("awardFloor")}</p>
            <p className="margin-y-1">
              {currencyOrFallback(summary.award_floor)}
            </p>
          </OpportunityDetailsCard>
        </div>
        <div className="grid-col-6">
          <OpportunityDetailsCard className="height-full">
            <p className="margin-y-1 text-bold">{t("awardCeiling")}</p>
            <p className="margin-y-1">
              {currencyOrFallback(summary.award_ceiling)}
            </p>
          </OpportunityDetailsCard>
        </div>
      </div>
      <OpportunityDetailsCard className="margin-top-2">
        <OpportunityDetailItem label={t("costSharing")}>
          {summary.is_cost_sharing === null
            ? notAvailable
            : summary.is_cost_sharing
              ? t("yes")
              : t("no")}
        </OpportunityDetailItem>
        <OpportunityDetailItem label={t("fundingInstrument")}>
          {fundingInstruments}
        </OpportunityDetailItem>
        <OpportunityDetailItem label={t("opportunityCategory")}>
          {opportunityData.category
            ? formatEnumValue(opportunityData.category)
            : notAvailable}
        </OpportunityDetailItem>
        {opportunityData.category_explanation && (
          <OpportunityDetailItem label={t("opportunityCategoryExplanation")}>
            {opportunityData.category_explanation}
          </OpportunityDetailItem>
        )}
        {fundingActivities.length ? (
          <div className="margin-y-1">
            <p className="margin-y-1 text-bold">{t("fundingActivity")}:</p>
            <ul className="usa-list margin-y-1">
              {fundingActivities.map((activity) => (
                <li key={activity}>{formatEnumValue(activity)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <OpportunityDetailItem label={t("fundingActivity")}>
            {notAvailable}
          </OpportunityDetailItem>
        )}
        {summary.funding_category_description && (
          <OpportunityDetailItem label={t("categoryExplanation")}>
            {summary.funding_category_description}
          </OpportunityDetailItem>
        )}
        <OpportunityDetailItem label={t("opportunityNumber")}>
          {opportunityData.opportunity_number || notAvailable}
        </OpportunityDetailItem>
      </OpportunityDetailsCard>
    </div>
  );
};

export default OpportunityAwardInfo;
