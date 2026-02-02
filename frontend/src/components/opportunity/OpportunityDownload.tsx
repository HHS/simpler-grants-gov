"use client";

import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { Button, Link } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type OpportunityDownloadProps = {
  attachments: OpportunityDocument[];
};

const OpportunityDownload = ({ attachments }: OpportunityDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return attachments.length > 0 ? (
    <Button
      type="button"
      unstyled
      className="margin-top-2 tablet:margin-top-0 flex-align-self-center"
    >
      <USWDSIcon name="arrow_downward" />
      <Link className="flex-align-self-center" href={"#opportunity-documents"}>
        {t("jumpToDocuments")}
      </Link>
    </Button>
  ) : null;
};

export default OpportunityDownload;
