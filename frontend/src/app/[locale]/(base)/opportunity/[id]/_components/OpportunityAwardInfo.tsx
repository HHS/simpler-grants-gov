import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import OpportunityAwardGridRow, {
  AwardDataKeys,
} from "./OpportunityAwardGridRow";

type Props = {
  opportunityData: BaseOpportunity;
};

type TranslationKeys =
  | "programFunding"
  | "expectedAwards"
  | "costSharing"
  | "fundingInstrument"
  | "opportunityCategory"
  | "opportunityCategoryExplanation"
  | "fundingActivity"
  | "categoryExplanation";

const OpportunityAwardInfo = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.awardInfo");

  const formatSubContent = (content: boolean | string | null | string[]) => {
    function formatStringReturnValue(str: string): string {
      const formattedStr = str.replace(/_/g, " ");
      return formattedStr.charAt(0).toUpperCase() + formattedStr.slice(1);
    }
    switch (typeof content) {
      case "boolean":
        return content ? t("yes") : t("no");
      case "string":
        return formatStringReturnValue(content);
      case "object":
        if (Array.isArray(content) && content.length) {
          return (
            <ul className="usa-list margin-y-0">
              {content.map((item, index) => (
                <li key={`contentList-${index}`}>
                  {formatStringReturnValue(item)}
                </li>
              ))}
            </ul>
          );
        }
        return t("notSpecified");
      default:
        return t("notSpecified");
    }
  };

  const fundingSummaryInfo = {
    programFunding:
      formatCurrency(opportunityData.summary.estimated_total_program_funding) ||
      t("notSpecified"),
    expectedAwards:
      opportunityData.summary.expected_number_of_awards || t("notSpecified"),
  };

  const awardGridInfo = {
    awardFloor: formatCurrency(opportunityData.summary.award_floor),
    awardCeiling: formatCurrency(opportunityData.summary.award_ceiling),
  };

  const awardSubInfo = {
    opportunityNumber: opportunityData.opportunity_number,
    costSharing: opportunityData.summary.is_cost_sharing,
    fundingInstrument: opportunityData.summary.funding_instruments,
    opportunityCategory: opportunityData.category,
    opportunityCategoryExplanation: opportunityData.category_explanation,
    fundingActivity: opportunityData.summary.funding_categories,
    categoryExplanation: opportunityData.summary.funding_category_description,
  };

  return (
    <div className="margin-top-4">
      <h2>{t("title")}</h2>
      <div
        className="border radius-md border-base-lighter padding-x-2 padding-y-1 margin-top-2 margin-bottom-2"
        data-testid="opportunity-funding-summary"
      >
        <ul className="usa-list usa-list--unstyled">
          {Object.entries(fundingSummaryInfo).map(([title, content]) => (
            <li key={title} className="margin-y-1">
              <strong>
                {t(title as TranslationKeys)}
                {":"}
              </strong>{" "}
              {content}
            </li>
          ))}
        </ul>
      </div>
      <Grid row className="grid-gap-2">
        {Object.entries(awardGridInfo).map(([title, content], index) => (
          <Grid
            className="margin-bottom-2"
            key={`category ${index}`}
            tabletLg={{ col: 6 }}
          >
            <OpportunityAwardGridRow
              content={content}
              title={title as AwardDataKeys}
            />
          </Grid>
        ))}
      </Grid>
      <div className="border radius-md border-base-lighter padding-x-2 padding-y-1">
        <ul className="usa-list usa-list--unstyled">
          {Object.entries(awardSubInfo).map(([title, content]) => (
            <li key={title} className="margin-y-105">
              <span className="display-block text-bold">
                {t(`${title as TranslationKeys}`)}
                {":"}
              </span>
              {formatSubContent(content)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OpportunityAwardInfo;
