import DOMPurify from "isomorphic-dompurify";
import {
  OpportunityDocument,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";
import { splitMarkup } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import OpportunityDownload from "src/components/opportunity/OpportunityDownload";
import { OpportunityEligibility } from "./OpportunityEligibility";

type OpportunityDescriptionProps = {
  summary: Summary;
  attachments: OpportunityDocument[];
};

const SummaryDescriptionDisplay = ({
  summaryDescription = "",
}: {
  summaryDescription: string;
}) => {
  const t = useTranslations("OpportunityListing.description");
  if (summaryDescription?.length < 750) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }

  const purifiedSummary = DOMPurify.sanitize(summaryDescription);

  const { preSplit, postSplit } = splitMarkup(purifiedSummary, 600);

  if (!postSplit) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: preSplit + "...",
        }}
      />
      <ContentDisplayToggle
        showCallToAction={t("show_description")}
        hideCallToAction={t("hide_summary_description")}
        positionButtonBelowContent={false}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: postSplit,
          }}
        />
      </ContentDisplayToggle>
    </>
  );
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
    <>
      <div className="usa-prose margin-top-3">
        <div className="display-block tablet:display-flex usa-prose flex-align-end">
          <h2 className="flex-1">{t("title")}</h2>
          <OpportunityDownload attachments={attachments} />
        </div>
        <SummaryDescriptionDisplay
          summaryDescription={summary.summary_description || ""}
        />
        <h2>{t("eligibility")}</h2>
        <h3>{t("eligible_applicants")}</h3>
        <OpportunityEligibility
          applicantTypes={summary.applicant_types || []}
        />
        <h3>{t("additional_info")}</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(additionalInformationOnEligibility),
          }}
        />
        <h2>{t("contact_info")}</h2>
        <h3>{t("contact_description")}</h3>
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
    </>
  );
};

export default OpportunityDescription;
