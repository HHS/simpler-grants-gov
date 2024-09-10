import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

type Props = {
  opportunityData: Opportunity;
};

const OpportunityLink = ({ opportunityData }: Props) => {
  return (
    <div className="usa-prose margin-top-2">
      <h3>Link to additonal information</h3>
      <p>
        <a href={opportunityData.summary.additional_info_url}>
          {opportunityData.summary.additional_info_url_description}
        </a>
      </p>
    </div>
  );
};

export default OpportunityLink;
