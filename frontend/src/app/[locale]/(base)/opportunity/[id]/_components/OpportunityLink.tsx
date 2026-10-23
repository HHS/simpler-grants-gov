import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type Props = {
  opportunityData: BaseOpportunity;
};

const OpportunityLink = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.link");
  const url = opportunityData.summary?.additional_info_url?.trim();
  const description =
    opportunityData.summary?.additional_info_url_description?.trim();

  return (
    <div className="margin-top-6">
      <h2>{t("title")}</h2>
      {url ? (
        <ul className="usa-list usa-list--unstyled margin-top-3">
          <li>
            <a
              className="usa-button usa-button--unstyled"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {description || url}
              <USWDSIcon name="launch" />
            </a>
          </li>
        </ul>
      ) : (
        <p>{t("noAdditionalInfo")}</p>
      )}
    </div>
  );
};

export default OpportunityLink;
