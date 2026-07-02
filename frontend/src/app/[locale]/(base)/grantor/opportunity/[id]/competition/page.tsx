import { CompetitionForm } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";

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
      <Button type="button" className="usa-button--outline">
        {t("saveAndExit")}
      </Button>
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
      >
        <ButtonSaveAndExit url={overviewUrl} />
      </OpportunityDetailsHeader>
      <CompetitionForm opportunity_id={id} />
    </>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
