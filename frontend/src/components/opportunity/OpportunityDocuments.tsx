import { Link, Table } from "@trussworks/react-uswds";
import { useTranslations } from "next-intl";

interface OpportunityDocument {
    opportunity_attachment_type: string;
    file_name: string;
    download_path: string;
    updated_at: string;
}

interface OpportunityDocumentsProps {
    documents: OpportunityDocument[];
}

const OpportunityDocuments = ({documents}: OpportunityDocumentsProps) => {
  const t = useTranslations("OpportunityListing.documents");

  const documentTable = (documents_filtered: OpportunityDocument[]) => {
    return (
        <>
            <thead>
                <tr>
                    <th scope="col">
                        {t('table_col_category')}
                    </th>
                    <th scope="col">
                        {t('table_col_file_name')}
                    </th>
                    <th scope="col">
                        {t('table_col_last_updated')}
                    </th>
                </tr>
            </thead>
            <tbody>
                {documents_filtered.map((document, index) => (
                    <tr key={index}>
                        <th
                            data-label={t('table_col_category')}
                            scope="row"
                        >
                            {document.opportunity_attachment_type === 'notice_of_funding_opportunity' ? t('type.funding_details') : t('type.other')}
                        </th>
                        <td data-label={t('table_col_file_name')}>
                            <Link target="_blank" href={document.download_path}>{document.file_name}</Link>
                        </td>
                        <td data-label={t('table_col_last_updated')}>
                            {new Date(document.updated_at).toDateString() + ' ' + new Date(document.updated_at).toTimeString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </>
      );
  }

  const related_docs = documents.filter(d => d.opportunity_attachment_type === 'notice_of_funding_opportunity')
  const forms = documents.filter(d => d.opportunity_attachment_type === 'other')

  return (
    <>
        <h2>{t("title")}</h2>
        <h3>{t("related")}</h3>
        {related_docs.length > 0 ? <Table>{documentTable(related_docs)}</Table> : <p>--</p>}
        <h3 className="margin-top-5">{t("forms")}</h3> 
        {forms.length > 0 ? <Table>{documentTable(forms)}</Table> : <p>--</p>}
    </>
  );
};

export default OpportunityDocuments;