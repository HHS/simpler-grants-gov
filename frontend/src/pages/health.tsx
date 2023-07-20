import type { GetServerSideProps, NextPage } from "next";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

const Health: NextPage = () => {
  return <>healthy</>;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default Health;
