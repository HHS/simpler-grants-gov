"use client";

import { downloadAttachmentsZip } from "src/utils/opportunity/zipDownloadUtils";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type ZipDownloadProps = {
  opportunityId: string;
};

const ZipDownloadButton = ({ opportunityId }: ZipDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return (
    <Button
      onClick={() => downloadAttachmentsZip(opportunityId)}
      outline
      type="button"
      id={`opportunity-document-button-${opportunityId}`}
    >
      <span>{t("zipDownload")} </span>
      <USWDSIcon name={"file_download"} className="usa-icon--size-4" />
    </Button>
  );
};

export default ZipDownloadButton;
