import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

type OpportunityContactProps = {
  summary: Summary;
};

const OpportunityContact = ({ summary }: OpportunityContactProps) => {
  const t = useTranslations("OpportunityListing.description");

  const emailDescription = summary.agency_email_address_description?.trim();
  const contactDescription = summary.agency_contact_description?.trim();
  const hasDescription = !!emailDescription || !!contactDescription;

  return (
    <div className="margin-top-6" data-testid="opportunity-contact">
      <h2>{t("contactInfo")}</h2>
      <p>
        <strong>{t("email")}</strong>{" "}
        {summary.agency_email_address ? (
          <a href={`mailto:${summary.agency_email_address}`}>
            {summary.agency_email_address}
          </a>
        ) : (
          t("notSpecified")
        )}
      </p>
      {emailDescription && <p>{emailDescription}</p>}
      {contactDescription && (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(contactDescription),
          }}
        />
      )}
      {!hasDescription && <p>{t("noContactInfo")}</p>}
    </div>
  );
};

export default OpportunityContact;
