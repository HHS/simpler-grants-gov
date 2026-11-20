"use client";

import { postUserEvent } from "src/services/event/postUserEvent";
import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { Link } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type OpportunityDownloadProps = {
  attachments: OpportunityDocument[];
  opportunityId: string;
};

const OpportunityDownload = ({
  attachments,
  opportunityId,
}: OpportunityDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return attachments.length > 0 ? (
    <Link
      variant="unstyled"
      className="display-flex flex-align-center margin-top-2 tablet:margin-top-0 flex-align-self-center"
      href="#opportunity-documents"
      onClick={() => {
        postUserEvent({
          name: "opportunity_click_jump_to_documents",
          properties: { opportunityId },
        });
      }}
    >
      <USWDSIcon name="arrow_downward" className="margin-right-1" />
      {t("jumpToDocuments")}
    </Link>
  ) : null;
};

export default OpportunityDownload;
