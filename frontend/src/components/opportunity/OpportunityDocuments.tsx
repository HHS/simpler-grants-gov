import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";

import { useTranslations } from "next-intl";
import { Link, Table } from "@trussworks/react-uswds";

interface OpportunityDocument {
  opportunity_attachment_type: string;
  file_name: string;
  download_path: string;
  updated_at: string;
}

interface OpportunityDocumentsProps {
  documents: OpportunityDocument[];
}

const DocumentTable = ({ documents }: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  dayjs.extend(advancedFormat);
  dayjs.extend(timezone);

  return (
    <>
      <thead>
        <tr>
          <th scope="col">{t("table_col_category")}</th>
          <th scope="col">{t("table_col_file_name")}</th>
          <th scope="col">{t("table_col_last_updated")}</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document, index) => (
          <tr key={index}>
            <th data-label={t("table_col_category")} scope="row">
              {document.opportunity_attachment_type ===
              "notice_of_funding_opportunity"
                ? t("type.funding_details")
                : t("type.other")}
            </th>
            <td data-label={t("table_col_file_name")}>
              <Link target="_blank" href={document.download_path}>
                {document.file_name}
              </Link>
            </td>
            <td data-label={t("table_col_last_updated")}>
              {/* https://day.js.org/docs/en/display/format */}
              {dayjs(document.updated_at).format("MMM D, YYYY hh:mm:ss A z")}
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

const OpportunityDocuments = ({ documents }: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  const relatedDocs = documents.filter(
    ({ opportunity_attachment_type }) =>
      opportunity_attachment_type === "notice_of_funding_opportunity",
  );
  const forms = documents.filter(
    ({ opportunity_attachment_type }) =>
      opportunity_attachment_type === "other",
  );

  return (
    <>
      <h2>{t("title")}</h2>
      <h3>{t("related")}</h3>
      {relatedDocs.length > 0 ? (
        <Table>
          <DocumentTable documents={relatedDocs} />
        </Table>
      ) : (
        <p>--</p>
      )}
      <h3 className="margin-top-5">{t("forms")}</h3>
      {forms.length > 0 ? (
        <Table>
          <DocumentTable documents={forms} />
        </Table>
      ) : (
        <p>--</p>
      )}
    </>
  );
};

export default OpportunityDocuments;
