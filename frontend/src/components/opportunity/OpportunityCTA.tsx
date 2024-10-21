import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const OpportunityContentBox = ({
  title,
  content,
}: {
  title: string | ReactNode;
  content: string | ReactNode;
}) => {
  return (
    <div className="border radius-md border-base-lighter padding-x-2">
      <p className="font-sans-sm text-bold margin-bottom-0">{title}</p>
      <p className="desktop-lg:font-sans-sm margin-top-0">{content}</p>
    </div>
  );
};

const OpportunityCTA = ({ status }: { status: string }) => {
  const t = useTranslations("OpportunityListing.cta");

  // will likely be dynamic based on status
  const titleKey = "title";
  const contentKey =
    status === "closed" || status === "archived"
      ? "closed_content"
      : "apply_content";

  const content = (
    <>
      <span>{t(contentKey)}</span>
      <Button type="button" outline={true} className="margin-top-2">
        <span>{t("button_content")}</span>
        <USWDSIcon
          name="launch"
          className="usa-icon usa-icon--size-4 text-middle"
        />
      </Button>
    </>
  );

  return (
    <div className="usa-prose margin-top-2">
      <OpportunityContentBox title={t(titleKey)} content={content} />
    </div>
  );
};

export default OpportunityCTA;
