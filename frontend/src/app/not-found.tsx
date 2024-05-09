import BetaAlert from "src/components/AppBetaAlert";
import { GridContainer } from "@trussworks/react-uswds";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

export default function NotFound() {
  unstable_setRequestLocale("en");
  const t = useTranslations("ErrorPages.page_not_found");
  return (
    <>
      <BetaAlert />
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15">
        <h1 className="nj-h1">{t("title")}</h1>
        <p className="margin-bottom-2">{t("message_content_1")}</p>
        <Link className="usa-button" href="/" key="returnToHome">
          {t("visit_homepage_button")}
        </Link>
      </GridContainer>
    </>
  );
}
