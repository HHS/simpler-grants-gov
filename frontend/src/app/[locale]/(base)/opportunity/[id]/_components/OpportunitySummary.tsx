import { Summary } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { ExpandableTextContent } from "src/components/core/ExpandableTextContent";
import { USWDSIcon } from "src/components/core/USWDSIcon";
import { SECTION_HEADING_CLASSES } from "./OpportunityDetailItem";

// the documents section always renders, even when empty, so the jump link is always shown
const JumpToDocuments = () => {
  const t = useTranslations("OpportunityListing.summary");
  return (
    <a
      className="usa-link text-bold display-inline-flex flex-align-center"
      href="#opportunity-documents"
    >
      <USWDSIcon name="arrow_downward" className="margin-right-05" />
      {t("jumpToDocuments")}
    </a>
  );
};

const OpportunitySummary = ({ summary }: { summary: Summary }) => {
  const t = useTranslations("OpportunityListing.summary");
  const summaryDescription = summary.summary_description;

  return (
    <div className="margin-bottom-4" data-testid="opportunity-description">
      <div className="display-flex flex-wrap flex-align-center flex-justify">
        {summaryDescription && (
          <h2 className={`${SECTION_HEADING_CLASSES} margin-right-2`}>
            {t("title")}
          </h2>
        )}
        <JumpToDocuments />
      </div>
      {summaryDescription && (
        <ExpandableTextContent
          textContent={summaryDescription}
          showCallToAction={t("showDescription")}
          hideCallToAction={t("hideSummaryDescription")}
        />
      )}
    </div>
  );
};

export default OpportunitySummary;
