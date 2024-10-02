import { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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
