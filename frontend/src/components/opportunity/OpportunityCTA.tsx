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

const OpportunityCTA = ({ legacyId }: { legacyId: number }) => {
  const t = useTranslations("OpportunityListing.cta");
  const legacyOpportunityURL = `${environment.LEGACY_HOST}/search-results-detail/${legacyId}`;

  const content = (
    <>
      <span>{t("applyContent")}</span>
      <a
        href={legacyOpportunityURL}
        target="_blank"
        rel="noopener noreferrer"
        className="display-block"
      >
        <Button type="button" outline={true} className="margin-top-2">
          <span>{t("buttonContent")}</span>
          <USWDSIcon name="launch" className="usa-icon--size-4 text-middle" />
        </Button>
      </a>
    </>
  );

  return (
    <div className="margin-top-2">
      <OpportunityContentBox title={t("applyTitle")} content={content} />
    </div>
  );
};

export default OpportunityCTA;
