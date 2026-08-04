import { CompetitionForm } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm";
import {
  ApiRequestError,
  MissingAuthError,
  parseErrorStatus,
} from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getForms } from "src/services/fetch/fetchers/allFormsFetcher";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@trussworks/react-uswds";

import LeftHandFormNav from "src/components/core/forms/LeftHandFormNav";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { OpportunityDetailsHeader } from "src/components/grantor-opportunities/OpportunityDetailsHeader";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export const dynamic = "force-dynamic";

const ButtonSaveAndExit = () => {
  const t = useTranslations("OpportunityCompetition");
  return (
    <>
      <Button
        type="submit"
        form="opportunity-competition-form"
        className="margin-left-1"
      >
        {t("button.saveAndExit")}
      </Button>
    </>
  );
};

async function OpportunityCompetitionPage({ params }: PageProps) {
  const { id, locale } = await params;
  const forms = await getForms();
  const t = await getTranslations({
    locale,
    namespace: "OpportunityCompetition",
  });

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

  // NOTE: Currently we are only supporting a single competition
  let competitionId: string = "";
  if (opportunityData.competitions?.[0]?.competition_id) {
    competitionId = opportunityData.competitions[0].competition_id;
  }

  const navigationItems = [
    {
      text: t("applicationRequirements"),
      href: "application-requirements",
    },
    {
      text: t("sectionSubmissionSetUp.header"),
      href: "submission-set-up",
    },
    {
      text: t("sectionSubmissionWindow.header"),
      href: "submission-window",
    },
    {
      text: t("sectionAgencyContact.header"),
      href: "agency-contact",
    },
    {
      text: t("sectionApplicationChecklist.header"),
      href: "application-checklist",
    },
    {
      text: t("sectionNarrativeFormatInstructions.header"),
      href: "narrative-format-instructions",
    },
  ];

  return (
    <div className="bg-white">
      <OpportunityDetailsHeader
        opportunityData={opportunityData}
        locale={locale}
        hasBackToOverview={true}
      >
        <ButtonSaveAndExit />
      </OpportunityDetailsHeader>

      <div className="grid-container padding-bottom-4">
        <div className="usa-in-page-nav-container">
          <LeftHandFormNav title={t("leftNavTitle")} fields={navigationItems} />

          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <CompetitionForm
              opportunityId={id}
              competitionId={competitionId}
              forms={forms.data}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityCompetitionPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
