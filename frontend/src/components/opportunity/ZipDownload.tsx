"use client";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type ZipDownloadProps = {
  opportunityId: number;
};

const downloadAttachmentsZip = (opportunityId: number) => {
  const path = `/api/attachment-download/${opportunityId}`;
  window.open(path, "_blank");
};

const ZipDownload = ({ opportunityId }: ZipDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return (
    <Button
      onClick={() => downloadAttachmentsZip(opportunityId)}
      type="button"
      id={`opportunity-document-button-${opportunityId}`}
    >
      <span>{t("zip_download")} </span>
      <USWDSIcon name={"file_download"} className="usa-icon--size-4" />
    </Button>
  );
};

export default ZipDownload;
