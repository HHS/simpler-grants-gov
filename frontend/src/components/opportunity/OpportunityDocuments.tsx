import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";
import { getConfiguredDayJs } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { Grid, Link, Table } from "@trussworks/react-uswds";

import ZipDownloadButton from "src/components/opportunity/ZipDownloadButton";

interface OpportunityDocumentsProps {
  documents: OpportunityDocument[];
  opportunityId: number;
}

const DocumentTable = ({
  documents,
  opportunityId,
}: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  return (
    <>
      <thead>
        <tr>
          <th scope="col">{t("table_col_file_name")}</th>
          <th scope="col">{t("table_col_description")}</th>
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
                id={`opportunity-document-link-${opportunityId}-${document.file_name}`}
              >
                {document.file_name}
              </Link>
            </td>
            <td data-label={t("table_col_description")}>
              <div>{document.file_description}</div>
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

const OpportunityDocuments = ({
  documents,
  opportunityId,
}: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  return (
    <Grid row className="margin-top-6">
      <Grid col={8} className="usa-prose">
        <h2 id="opportunity_documents">{t("title")}</h2>
      </Grid>
      {documents.length > 0 ? (
        <>
          <Grid col={4} className="text-right">
            <ZipDownloadButton
              opportunityId={opportunityId}
            ></ZipDownloadButton>
          </Grid>
          <Table className="width-full overflow-wrap">
            <DocumentTable
              documents={documents}
              opportunityId={opportunityId}
            />
          </Table>
        </>
      ) : (
        <p>{t("noDocuments")}</p>
      )}
    </Grid>
  );
};

export default OpportunityDocuments;
