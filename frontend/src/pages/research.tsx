import type { GetStaticProps, NextPage } from "next";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageSEO from "src/components/PageSEO";
import FullWidthAlert from "../components/FullWidthAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import { RESEARCH_CRUMBS } from "src/constants/breadcrumbs"

const Research: NextPage = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <FullWidthAlert type="info" heading={t("alert_title")}>
        <Trans
          t={t}
          i18nKey="alert"
          components={{
            LinkToGrants: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GRANTS_HOME}
              />
            ),
          }}
        />
      </FullWidthAlert>
      <Breadcrumbs breadcrumbList={RESEARCH_CRUMBS} />
      Research Placeholder
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Research;
