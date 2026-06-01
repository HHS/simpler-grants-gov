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
    summary.applicant_eligibility_description ?? "--";
  const agencyEmailLink = summary?.agency_email_address ? (
    <a href={`mailto:${summary.agency_email_address}`}>
      {summary.agency_email_address}
    </a>
  ) : (
    "--"
  );

  return (
    <div className="margin-top-6" data-testid="opportunity-description">
      <div className="display-block tablet:display-flex flex-align-end margin-bottom-2">
        <h2 className="flex-1">{t("title")}</h2>
        <OpportunityDownload attachments={attachments} />
      </div>
      <ExpandableTextContent
        textContent={summary.summary_description || ""}
        showCallToAction={t("showDescription")}
        hideCallToAction={t("hideSummaryDescription")}
      />
      <h2>{t("eligibility")}</h2>
      <h3>{t("eligibleApplicants")}</h3>
      <OpportunityEligibility applicantTypes={summary.applicant_types || []} />
      <h3>{t("additionalInfo")}</h3>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(additionalInformationOnEligibility),
        }}
      />
      <h2>{t("contactInfo")}</h2>
      <h3>{t("contactDescription")}</h3>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            summary?.agency_contact_description || "--",
          ),
        }}
      />
      <h4>{t("email")}</h4>
      {summary?.agency_email_address_description && (
        <p>{summary.agency_email_address_description}</p>
      )}
      <p>{agencyEmailLink}</p>
    </div>
  );
};

export default OpportunityDescription;
