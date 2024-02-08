import type { GetStaticProps, NextPage } from "next";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Search: NextPage = () => {
  return <>Search Boilerplate</>;
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");

  // TODO: update the statement below with a feature flag check
  const hideSearchPage = true;
  // redirects to default 404 page  
  if (hideSearchPage) return { notFound: true };

  return { props: { ...translations } };
};

export default Search;
