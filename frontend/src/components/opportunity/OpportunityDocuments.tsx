import { getConfiguredDayJs } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { Link, Table } from "@trussworks/react-uswds";

interface OpportunityDocument {
  file_name: string;
  download_path: string;
  updated_at: string;
}

interface OpportunityDocumentsProps {
  documents: OpportunityDocument[];
  id: number;
}

const DocumentTable = ({ documents, id }: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  return (
    <>
      <thead>
        <tr>
          <th scope="col">{t("table_col_file_name")}</th>
          <th scope="col">{t("table_col_last_updated")}</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document, index) => (
          <tr key={index}>
            <td data-label={t("table_col_file_name")}>
              <Link
                target="_blank"
                href={document.download_path}
                id={`opportunity-document-link-${id}-${document.file_name}`}
              >
                {document.file_name}
              </Link>
            </td>
            <td data-label={t("table_col_last_updated")}>
              {/* https://day.js.org/docs/en/display/format */}
              {getConfiguredDayJs()(document.updated_at).format(
                "MMM D, YYYY hh:mm A z",
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

const OpportunityDocuments = ({ documents, id }: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  return (
    <>
      <h2 id="opportunity_documents">{t("title")}</h2>
      {documents.length > 0 ? (
        <Table>
          <DocumentTable documents={documents} id={id} />
        </Table>
      ) : (
        <p>--</p>
      )}
    </>
  );
};

export default OpportunityDocuments;
