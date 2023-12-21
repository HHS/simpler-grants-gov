import type { GetStaticProps, NextPage } from "next";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "../components/BetaAlert";

const PageNotFound: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "ErrorPages" });

  return (
    <>
      <BetaAlert />
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15">
        <h1 className="nj-h1">{t("page_not_found.title")}</h1>
        <p className="margin-bottom-2">
          {t("page_not_found.message_content_1")}
        </p>
        <Link className="usa-button" href="/" key="returnToHome">
          {t("page_not_found.visit_homepage_button")}
        </Link>
      </GridContainer>
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default PageNotFound;
