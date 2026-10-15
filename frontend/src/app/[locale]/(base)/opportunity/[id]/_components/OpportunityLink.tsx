import { environment } from "src/constants/environments";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import LegacyLink from "src/components/core/LegacyLink";
import { USWDSIcon } from "src/components/core/USWDSIcon";
import { SECTION_HEADING_CLASSES } from "./OpportunityDetailItem";

type Props = {
  opportunityData: Pick<BaseOpportunity, "summary" | "legacy_opportunity_id">;
};

const OpportunityLink = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.link");
  const { summary, legacy_opportunity_id: legacyId } = opportunityData;
  const legacyOpportunityURL = `${environment.LEGACY_HOST}/search-results-detail/${legacyId}`;

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      <ul className="usa-list usa-list--unstyled">
        <li className="margin-bottom-1">
          {summary.additional_info_url ? (
            <a
              className="usa-link"
              href={summary.additional_info_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {summary.additional_info_url_description ||
                summary.additional_info_url}
              <USWDSIcon name="launch" className="text-middle margin-left-05" />
            </a>
          ) : (
            t("noAdditionalInfo")
          )}
        </li>
        {legacyId && (
          <li>
            <LegacyLink
              className="usa-link"
              href={legacyOpportunityURL}
              userEvent={{
                name: "click_legacy_opportunity_link",
                properties: {
                  legacyOpportunityURL,
                  legacyOpportunityId: legacyId,
                },
              }}
            >
              {t("viewOnGrantsGov")}
              <USWDSIcon name="launch" className="text-middle margin-left-05" />
            </LegacyLink>
          </li>
        )}
      </ul>
    </div>
  );
};

export default OpportunityLink;
