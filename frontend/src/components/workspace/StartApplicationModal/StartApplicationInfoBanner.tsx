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
      <ul
        className="usa-list margin-top-0 font-sans-2xs"
        style={{ marginBottom: 0 }}
      >
        <li style={{ marginBottom: 0 }}>{t("bullet1")}</li>
        <li style={{ marginBottom: 0 }}>
          {t.rich("bullet2", {
            applicationsPageLink: (chunk) => (
              <Link href="/applications" className="usa-link">
                {chunk}
              </Link>
            ),
          })}
        </li>
        <li style={{ marginBottom: 0 }}>{t("bullet3")}</li>
      </ul>
    </Alert>
  );
};
