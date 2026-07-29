import { CompetitionForm } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm";
import {
  ApiRequestError,
  MissingAuthError,
  parseErrorStatus,
} from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getForms } from "src/services/fetch/fetchers/allFormsFetcher";
import { updateCompetitionForms } from "src/services/fetch/fetchers/competitionFormsFetcher";
import {
  createCompetitionForGrantor,
  getOpportunityForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { Competition } from "src/types/competitionsResponseTypes";

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

const submitCompetitionForms = async (
  competitionId: string,
  body: { forms: { form_id: string; is_required: boolean }[] },
) => {
  "use server";
  await updateCompetitionForms({ competitionId, body });
};

async function OpportunityCompetitionPage({ params }: PageProps) {
  const { id, locale } = await params;
  const overviewUrl = "../" + id + "/overview";
  const forms = await getForms();

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
  let competition: Competition;
  if (opportunityData.competitions?.[0]?.competition_id) {
    competition = opportunityData.competitions[0];
    competitionId = competition.competition_id;
  } else {
    try {
      const competitionResponse = await createCompetitionForGrantor(id);
      competition = competitionResponse.data;
      competitionId = competition.competition_id;
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
      <CompetitionForm
        opportunityId={id}
        competitionId={competitionId}
        forms={forms.data}
        competition={competition}
        submitCompetitionForms={submitCompetitionForms}
      />
    </>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
