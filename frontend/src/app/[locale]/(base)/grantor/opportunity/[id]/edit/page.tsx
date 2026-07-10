import OpportunityEditForm from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/_components/OpportunityEditForm";
import {
  ApiRequestError,
  MissingAuthError,
  parseErrorStatus,
} from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { buildOpportunityEditInitialValues } from "src/utils/opportunityEditFormConfig";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Alert, Button, GridContainer } from "@trussworks/react-uswds";

import LeftHandFormNav from "src/components/core/forms/LeftHandFormNav";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";
import { OpportunityDetailsHeader } from "src/components/grantor-opportunities/OpportunityDetailsHeader";

export const dynamic = "force-dynamic";

const HeaderButtons = ({ saveAndExitLabel }: { saveAndExitLabel: string }) => {
  return (
    <>
      <Button
        type="submit"
        form="opportunity-edit-form"
        className="margin-left-1"
      >
        {saveAndExitLabel}
      </Button>
    </>
  );
};

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

async function OpportunityEditPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Errors" });
  const tEdit = await getTranslations({ locale, namespace: "OpportunityEdit" });

  // TODO(#8601): Replace this fail-closed placeholder with a real grantor authorization
  // check once the frontend has a way to verify whether the current session can edit
  // this opportunity for its agency.
  const hasVerifiedGrantorEditAccess = true;

  let opportunityData: GrantorOpportunityDetail;
  let opportunitySummaryId: string;
  try {
    const response = await getOpportunityForGrantor(id);
    opportunityData = response.data;
    opportunitySummaryId =
      response.data.forecast_summary?.opportunity_summary_id ??
      response.data.non_forecast_summary?.opportunity_summary_id ??
      "";
  } catch (error) {
    if (error instanceof MissingAuthError) {
      // TODO: should be an anauthenticated message
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

  if (id !== opportunityData.opportunity_id) {
    return (
      <GridContainer className="margin-top-4">
        <Alert type="error" heading={t("heading")} headingLevel="h4">
          {t("genericMessage")}
        </Alert>
      </GridContainer>
    );
  }

  if (!hasVerifiedGrantorEditAccess) {
    return <UnauthorizedMessage />;
  }

  const activeSummary =
    opportunityData.forecast_summary ??
    opportunityData.non_forecast_summary ??
    opportunityData.summary;
  const initialValues = buildOpportunityEditInitialValues({
    ...opportunityData,
    attachments: [],
    summary: activeSummary,
  });
  const navigationItems = [
    { text: tEdit("sections.fundingDetails"), href: "funding-details" },
    { text: tEdit("sections.eligibility"), href: "eligibility" },
    {
      text: tEdit("sections.additionalInformation"),
      href: "additional-information",
    },
    { text: tEdit("sections.attachments"), href: "attachments" },
  ];
  return (
    <div className="bg-white">
      <OpportunityDetailsHeader
        opportunityData={opportunityData}
        locale={locale}
        hasBackToOverview={true}
      >
        <HeaderButtons saveAndExitLabel={tEdit("button.saveAndExit")} />
      </OpportunityDetailsHeader>

      <div className="grid-container padding-bottom-4">
        <div className="usa-in-page-nav-container">
          <LeftHandFormNav title={tEdit("navTitle")} fields={navigationItems} />

          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <OpportunityEditForm
              opportunityId={opportunityData.opportunity_id}
              opportunitySummaryId={opportunitySummaryId}
              isForecast={!!opportunityData.forecast_summary}
              initialValues={initialValues}
              isDraft={!!opportunityData.is_draft}
              initialAttachments={opportunityData.attachments ?? []}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityEditPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
