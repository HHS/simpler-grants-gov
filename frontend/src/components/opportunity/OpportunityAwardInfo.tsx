import { Grid } from "@trussworks/react-uswds";
import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import OpportunityAwardGridRow from "./OpportunityAwardGridRow";

type Props = {
  opportunityData: Opportunity;
};

const formatCurrency = (number: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatSubContent = (content: boolean | string | null | string[]) => {
  function formatStringReturnValue(str: string): string {
    const formattedStr = str.replace(/_/g, " ");
    return formattedStr.charAt(0).toUpperCase() + formattedStr.slice(1);
  }
  switch (typeof content) {
    case "boolean":
      return content ? "Yes" : "No";
    case "string":
      return formatStringReturnValue(content);
    case "object":
      if (Array.isArray(content)) {
        return content.length
          ? content.map((content) => (
              <p className="line-height-sans-1">
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

const OpportunityAwardInfo = ({ opportunityData }: Props) => {
  const awardGridInfo = {
    "Program Funding": formatCurrency(
      opportunityData.summary.estimated_total_program_funding,
    ),
    "Expected awards": opportunityData.summary.expected_number_of_awards,
    "Award Ceiling": formatCurrency(opportunityData.summary.award_ceiling),
    "Award Floor": formatCurrency(opportunityData.summary.award_floor),
  };

  const awardSubInfo = {
    "Cost sharing or matching requirement":
      opportunityData.summary.is_cost_sharing,
    "Funding instrument type": opportunityData.summary.funding_instruments,
    "Opportunity Category": opportunityData.category,
    "Opportunity Category Explanation": opportunityData.category_explanation,
    "Category of Funding Activity": opportunityData.summary.funding_categories,
    "Category Explanation":
      opportunityData.summary.funding_category_description,
  };

  return (
    <div className="usa-prose margin-top-2">
      <h2>Award</h2>
      <Grid row className="margin-top-2 grid-gap-2">
        {Object.entries(awardGridInfo).map(([title, content]) => (
          <Grid
            className="margin-bottom-2"
            key={title + "-key"}
            tabletLg={{ col: 6 }}
          >
            <OpportunityAwardGridRow content={content} title={title} />
          </Grid>
        ))}
      </Grid>

      {Object.entries(awardSubInfo).map(([title, content]) => (
        <>
          <p className={"text-bold"}>
            {title}
            {":"}
          </p>
          <p className={"margin-top-0"}>{formatSubContent(content)}</p>
        </>
      ))}
    </div>
  );
};

export default OpportunityAwardInfo;
