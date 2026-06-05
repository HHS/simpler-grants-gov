import { Metadata } from "next";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { CompetitionForm } from "src/components/opportunities/competition/CompetitionForm";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "OpportunityCompetition",
  });
  return {
    title: t("pageTitle"),
    description: t("metaDescription"),
  };
}

async function OpportunityCompetitionPage({ params }: PageProps) {
  // TODO(#10507): fetch opportunity by id, handle 403 with <UnauthorizedMessage />
  const { id: _id, locale: _locale } = await params;
  const session = await getSession();
  if (!session || !session.token) {
    return <UnauthorizedMessage />;
  }

  return <CompetitionForm />;
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
