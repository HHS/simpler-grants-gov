import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

type Props = {
  opportunityData: Opportunity;
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
    <div className="usa-prose margin-top-2">
      <h3>{t("title")}</h3>
      <p>{link}</p>
    </div>
  );
};

export default OpportunityLink;
