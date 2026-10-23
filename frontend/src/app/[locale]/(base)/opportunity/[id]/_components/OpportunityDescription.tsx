import DOMPurify from "isomorphic-dompurify";
import {
  OpportunityDocument,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { ExpandableTextContent } from "src/components/core/ExpandableTextContent";
import OpportunityDownload from "./OpportunityDownload";
import { OpportunityEligibility } from "./OpportunityEligibility";

type OpportunityDescriptionProps = {
  summary: Summary;
  attachments: OpportunityDocument[];
};

const OpportunityDescription = ({
  summary,
  attachments,
}: OpportunityDescriptionProps) => {
  const t = useTranslations("OpportunityListing.description");

  const additionalInformationOnEligibility =
    summary.applicant_eligibility_description ?? "";
  return (
    <div data-testid="opportunity-description">
      <div className="display-block tablet:display-flex flex-align-end margin-bottom-2">
        <h2 className="flex-1">{t("title")}</h2>
        <OpportunityDownload attachments={attachments} />
      </div>
      <ExpandableTextContent
        textContent={summary.summary_description || ""}
        showCallToAction={t("showDescription")}
        hideCallToAction={t("hideSummaryDescription")}
        emptyText={t("notSpecified")}
      />
      <h2>{t("eligibility")}</h2>
      <div className="padding-left-6">
        <OpportunityEligibility
          applicantTypes={summary.applicant_types || []}
        />
      </div>
      <h3>{t("additionalInfo")}</h3>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            additionalInformationOnEligibility || t("notSpecified"),
          ),
        }}
      />
    </div>
  );
};

export default OpportunityDescription;
