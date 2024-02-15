import type { GetStaticProps, NextPage } from "next";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageNotFound from "./404";

const Search: NextPage = () => {
  const { featureFlagsManager, mounted } = useFeatureFlags();

  if (!mounted) return null;
  if (!featureFlagsManager.isFeatureEnabled("showSearchV0")) {
    return <PageNotFound />;
  }

  return <>Search Boilerplate</>;
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");

  return { props: { ...translations } };
};

export default Search;
