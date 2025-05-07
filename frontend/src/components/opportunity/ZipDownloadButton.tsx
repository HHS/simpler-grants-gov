"use client";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type ZipDownloadProps = {
  opportunityId: number;
  testId?: string;
};

const downloadAttachmentsZip = (opportunityId: number) => {
  const path = `/api/opportunities/${opportunityId}/attachments-download`;
  window.open(path, "_blank");
};

const ZipDownloadButton = ({ opportunityId, testId }: ZipDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return (
    <Button
      onClick={() => downloadAttachmentsZip(opportunityId)}
      outline
      type="button"
      id={`opportunity-document-button-${opportunityId}`}
      data-testid={testId}
    >
      <span>{t("zip_download")} </span>
      <USWDSIcon name={"file_download"} className="usa-icon--size-4" />
    </Button>
  );
};

export default ZipDownloadButton;
