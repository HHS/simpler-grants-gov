"use client";

import { OpportunityDocument } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { Link } from "@trussworks/react-uswds";

type OpportunityDownloadProps = {
  attachments: OpportunityDocument[];
};

const OpportunityDownload = ({ attachments }: OpportunityDownloadProps) => {
  const t = useTranslations("OpportunityListing.description");

  return (
    <>
      {attachments.length > 0 ? (
        <div className="grid-row flex-justify">
          <Link
            className="flex-align-self-center"
            href={"#opportunity_documents"}
          >
            {t("jump_to_documents")}
          </Link>
        </div>
      ) : null}
    </>
  );
};

export default OpportunityDownload;
