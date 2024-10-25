import { environment } from "src/constants/environments";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export const OpportunityContentBox = ({
  title,
  content,
}: {
  title?: string | ReactNode;
  content: string | ReactNode;
}) => {
  return (
    <div className="border radius-md border-base-lighter padding-x-2">
      {title && <p className="text-bold margin-bottom-0">{title}</p>}
      <p className="desktop-lg:font-sans-sm margin-top-0">{content}</p>
    </div>
  );
};

const OpportunityCTA = ({ id }: { id: number }) => {
  const t = useTranslations("OpportunityListing.cta");
  const legacyOpportunityURL = `${environment.LEGACY_HOST}/search-results-detail/${id}`;

  const content = (
    <>
      <span>{t("apply_content")}</span>
      <a href={legacyOpportunityURL} target="_blank" rel="noopener noreferrer">
        <Button type="button" outline={true} className="margin-top-2">
          <span>{t("button_content")}</span>
          <USWDSIcon
            name="launch"
            className="usa-icon usa-icon--size-4 text-middle"
          />
        </Button>
      </a>
    </>
  );

  return (
    <div className="usa-prose margin-top-2">
      <OpportunityContentBox title={t("apply_title")} content={content} />
    </div>
  );
};

export default OpportunityCTA;
