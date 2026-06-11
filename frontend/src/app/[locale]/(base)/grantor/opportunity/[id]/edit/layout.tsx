import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { LayoutProps } from "src/types/generalTypes";

import { getTranslations } from "next-intl/server";

import { AuthenticationGate } from "src/components/core/AuthenticationGate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale });
  let title = t("OpportunityEdit.pageTitle");
  try {
    const session = await getSession();
    if (session?.token) {
      const { data } = await getOpportunityForGrantor(id);
      title = `${t("OpportunityEdit.pageTitle")} - ${data.opportunity_title || ""}`;
    }
  } catch {
    // fall back to static title
  }
  return {
    title,
    description: t("OpportunityEdit.metaDescription"),
  };
}

export default function UserLayout({ children }: LayoutProps) {
  return <AuthenticationGate>{children}</AuthenticationGate>;
}
