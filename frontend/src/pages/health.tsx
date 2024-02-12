import type { GetStaticProps, NextPage } from "next";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

const Health: NextPage = () => {
  const {
    featureFlagsManager, // An instance of FeatureFlagsManager
    mounted, // Useful for hydration
  } = useFeatureFlags();

  if (featureFlagsManager.isFeatureEnabled("hideSearch")) {
    console.log("hideSearch flag is true");
  } else {
    console.log("hideSearch flag is false");
  }

  if (!mounted) {
    // To allow hydration
    return null;
  }

  return <>healthy</>;
};
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Health;
