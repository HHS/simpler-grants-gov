import { Metadata } from "next";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Organizations.pageTitle"),
    description: t("Organizations.metaDescription"),
  };
  return meta;
}

export default function OrganizationsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
