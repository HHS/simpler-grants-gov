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
        return (
          <p className="line-height-sans-1">
            {formatStringReturnValue(content)}
          </p>
        );
      case "object":
        if (Array.isArray(content)) {
          return content.length
            ? content.map((content, index) => (
                <p className="line-height-sans-1" key={`contentList-${index}`}>
                  {formatStringReturnValue(content)}
                </p>
              ))
            : "--";
        }
        return "--";
      default:
        return "--";
    }
  };

  const awardGridInfo = {
    programFunding: formatCurrency(
      opportunityData.summary.estimated_total_program_funding,
    ),
    expectedAwards: opportunityData.summary.expected_number_of_awards,
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
      <h2>Award</h2>
      <Grid row className="margin-top-2 grid-gap-2">
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

      {Object.entries(awardSubInfo).map(([title, content], index) => (
        <div key={`awardInfo-${index}`}>
          <p className={"text-bold"}>
            {t(`${title as TranslationKeys}`)}
            {":"}
          </p>
          <div>{formatSubContent(content)}</div>
        </div>
      ))}
    </div>
  );
};

export default OpportunityAwardInfo;
