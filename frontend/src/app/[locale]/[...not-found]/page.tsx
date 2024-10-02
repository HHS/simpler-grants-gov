import { Metadata } from "next";

import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";


export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("ErrorPages.page_not_found.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function NotFoundDummy() {
  notFound();
}
