import DOMPurify from "isomorphic-dompurify";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { SECTION_HEADING_CLASSES } from "./OpportunityDetailItem";

const OpportunityAgencyContact = ({ summary }: { summary: Summary }) => {
  const t = useTranslations("OpportunityListing.agencyContact");
  const {
    agency_email_address: email,
    agency_email_address_description: emailDescription,
    agency_contact_description: contactDescription,
  } = summary;

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      {email && (
        <p>
          <strong>{t("email")}:</strong>{" "}
          <a className="usa-link" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      )}
      {emailDescription && <p>{emailDescription}</p>}
      {contactDescription && (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(contactDescription),
          }}
        />
      )}
      {!emailDescription && !contactDescription && (
        <p>{t("noAdditionalContactInfo")}</p>
      )}
    </div>
  );
};

export default OpportunityAgencyContact;
