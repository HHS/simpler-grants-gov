import { useTranslations } from "next-intl";
import Link from "next/link";
import { Alert } from "@trussworks/react-uswds";

export const StartApplicationInfoBanner = () => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.helpfulTips",
  );

  return (
    <Alert
      type="info"
      headingLevel="h4"
      heading={t("title")}
      noIcon={true}
      slim={false}
      validation={true}
      data-testid="helpful-tips-banner"
    >
      <ul className="usa-list margin-top-0">
        <li>{t("bullet1")}</li>
        <li>
          {t.rich("bullet2", {
            applicationsPageLink: (chunk) => (
              <Link href="/applications" className="usa-link">
                {chunk}
              </Link>
            ),
          })}
        </li>
        <li>{t("bullet3")}</li>
      </ul>
    </Alert>
  );
};
