import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

type Props = {
  opportunityData: BaseOpportunity;
};

const OpportunityLink = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.link");
  const link = opportunityData.summary?.additional_info_url ? (
    <a href={opportunityData.summary.additional_info_url}>
      {opportunityData.summary.additional_info_url_description ||
        opportunityData.summary.additional_info_url}
    </a>
  ) : (
    "--"
  );
  return (
    <div className="margin-top-6">
      <h2>{t("title")}</h2>
      <p>{link}</p>
    </div>
  );
};

export default OpportunityLink;
