import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { CompetitionForm } from "src/components/opportunities/competition/CompetitionForm";
import { OpportunityDetailsHeader } from "src/components/opportunities/competition/OpportunityDetailsHeader";

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
  const { id, locale } = await params;
  const session = await getSession();
  if (!session || !session.token) {
    return <UnauthorizedMessage />;
  }

  let opportunityData;
  try {
    const response = await getOpportunityForGrantor(id);
    opportunityData = response.data;
  } catch (error) {
    const status = parseErrorStatus(error as ApiRequestError);
    if (status === 404) {
      notFound();
    }
    if (status === 403) {
      return <UnauthorizedMessage />;
    }
    throw error;
  }

  return (
    <>
      <OpportunityDetailsHeader
        opportunityData={opportunityData}
        locale={locale}
      />
      <CompetitionForm />
    </>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
