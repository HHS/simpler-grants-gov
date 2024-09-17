import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { useTranslations } from "next-intl";

type Props = {
  opportunityData: Opportunity;
};

const OpportunityLink = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.link");
  if (
    opportunityData.summary.additional_info_url === null ||
    opportunityData.summary.additional_info_url_description === null
  ) {
    return (
      <div className="usa-prose margin-top-2">
        <h3>{t("title")}</h3>
        <p>--</p>
      </div>
    );
  } else {
    return (
      <div className="usa-prose margin-top-2">
        <h3>{t("title")}</h3>
        <p>
          <a href={opportunityData.summary.additional_info_url}>
            {opportunityData.summary.additional_info_url_description}
          </a>
        </p>
      </div>
    );
  }
};

export default OpportunityLink;
