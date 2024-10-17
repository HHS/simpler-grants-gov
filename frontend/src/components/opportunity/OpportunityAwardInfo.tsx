import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import OpportunityAwardGridRow, {
  AwardDataKeys,
} from "./OpportunityAwardGridRow";

type Props = {
  opportunityData: Opportunity;
};

type TranslationKeys =
  | "cost_sharing"
  | "funding_instrument"
  | "opportunity_category"
  | "opportunity_category_explanation"
  | "funding_activity"
  | "category_explanation";

const OpportunityAwardInfo = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.award_info");

  const formatCurrency = (number: number | null) => {
    if (number) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(number);
    }
    return "";
  };

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
    program_funding: formatCurrency(
      opportunityData.summary.estimated_total_program_funding,
    ),
    expected_awards: opportunityData.summary.expected_number_of_awards,
    award_ceiling: formatCurrency(opportunityData.summary.award_ceiling),
    award_floor: formatCurrency(opportunityData.summary.award_floor),
  };

  const awardSubInfo = {
    cost_sharing: opportunityData.summary.is_cost_sharing,
    funding_instrument: opportunityData.summary.funding_instruments,
    opportunity_category: opportunityData.category,
    opportunity_category_explanation: opportunityData.category_explanation,
    funding_activity: opportunityData.summary.funding_categories,
    category_explanation: opportunityData.summary.funding_category_description,
  };

  return (
    <div className="usa-prose margin-top-2">
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
          <div className={"margin-top-0"}>{formatSubContent(content)}</div>
        </div>
      ))}
    </div>
  );
};

export default OpportunityAwardInfo;
