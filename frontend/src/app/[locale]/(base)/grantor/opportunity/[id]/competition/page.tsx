import { CompetitionForm } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm";
import {
  ApiRequestError,
  MissingAuthError,
  parseErrorStatus,
} from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  createCompetitionForGrantor,
  getOpportunityForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";

import { useTranslations } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { Button, Link } from "@trussworks/react-uswds";

import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { OpportunityDetailsHeader } from "src/components/grantor-opportunities/OpportunityDetailsHeader";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export const dynamic = "force-dynamic";

const ButtonSaveAndExit = ({ url }: { url: string }) => {
  const t = useTranslations("OpportunityCompetition.button");
  return (
    <Link href={url}>
      <Button type="button">{t("saveAndExit")}</Button>
    </Link>
  );
};

async function OpportunityCompetitionPage({ params }: PageProps) {
  const { id, locale } = await params;
  const overviewUrl = "../" + id + "/overview";

  let opportunityData;
  try {
    const response = await getOpportunityForGrantor(id);
    opportunityData = response.data;
  } catch (error) {
    if (error instanceof MissingAuthError) {
      return <UnauthorizedMessage />;
    }
    const status = parseErrorStatus(error as ApiRequestError);
    if (status === 404) {
      notFound();
    }
    if (status === 403) {
      return <UnauthorizedMessage />;
    }
    throw error;
  }

  let competitionId: string;
  if (opportunityData.competitions?.[0]?.competition_id) {
    competitionId = opportunityData.competitions[0].competition_id;
  } else {
    try {
      const competitionResponse = await createCompetitionForGrantor(id);
      competitionId = competitionResponse.data.competition_id;
    } catch (error) {
      if (error instanceof MissingAuthError) {
        return <UnauthorizedMessage />;
      }
      const status = parseErrorStatus(error as ApiRequestError);
      if (status === 404) {
        notFound();
      }
      if (status === 403) {
        return <UnauthorizedMessage />;
      }
      throw error;
    }
  }

  return (
    <>
      <OpportunityDetailsHeader
        opportunityData={opportunityData}
        locale={locale}
      >
        <ButtonSaveAndExit url={overviewUrl} />
      </OpportunityDetailsHeader>
      <CompetitionForm opportunityId={id} competitionId={competitionId} />
    </>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
