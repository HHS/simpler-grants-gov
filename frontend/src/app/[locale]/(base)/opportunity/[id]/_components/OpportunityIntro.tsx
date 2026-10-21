import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { legacyOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type Props = {
  opportunityData: OpportunityDetail;
};

// agency, assistance listings, and last updated date are displayed in the OpportunityHeader
const OpportunityIntro = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.intro");

  return (
    <p className="tablet-lg:font-sans-2xs">
      <a
        className="usa-button usa-button--unstyled"
        href={legacyOpportunityUrl(opportunityData.legacy_opportunity_id)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("versionHistory")}
        <USWDSIcon name="launch" />
      </a>
    </p>
  );
};

export default OpportunityIntro;
