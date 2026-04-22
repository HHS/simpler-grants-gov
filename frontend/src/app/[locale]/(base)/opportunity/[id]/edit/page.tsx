import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Alert, Button, GridContainer } from "@trussworks/react-uswds";

import ApplyFormNav from "src/components/applyForm/ApplyFormNav";
import OpportunityEditForm from "src/components/opportunity/OpportunityEditForm";
import { buildOpportunityEditInitialValues } from "src/components/opportunity/opportunityEditFormConfig";
import OpportunityEditHeaderActions from "src/components/opportunity/OpportunityEditHeaderActions";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";
import { USWDSIcon } from "src/components/USWDSIcon";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams?: Promise<Record<string, string>>;
};

export const dynamic = "force-dynamic";

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
      const { data } = await getOpportunityForGrantor(id, session.token);
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

async function OpportunityEditPage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isNewlyCreated = resolvedSearchParams.fromCreate === "true";
  const t = await getTranslations({ locale, namespace: "Errors" });
  const tEdit = await getTranslations({ locale, namespace: "OpportunityEdit" });

  const session = await getSession();
  if (!session || !session.token) {
    return <UnauthorizedMessage />;
  }

  // TODO(#8601): Replace this fail-closed placeholder with a real grantor authorization
  // check once the frontend has a way to verify whether the current session can edit
  // this opportunity for its agency.
  const hasVerifiedGrantorEditAccess = true;

  let opportunityData: GrantorOpportunityDetail;
  let opportunitySummaryId: string;
  try {
    const response = await getOpportunityForGrantor(id, session.token);
    opportunityData = response.data;
    opportunitySummaryId =
      response.data.forecast_summary?.opportunity_summary_id ??
      response.data.non_forecast_summary?.opportunity_summary_id ??
      "";
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

  const primaryAssistanceListing =
    opportunityData.opportunity_assistance_listings[0];
  const activeSummary =
    opportunityData.forecast_summary ??
    opportunityData.non_forecast_summary ??
    opportunityData.summary;
  const initialValues = buildOpportunityEditInitialValues({
    ...opportunityData,
    summary: activeSummary,
  });
  const stageLabels: Record<string, string> = {
    archived: tEdit("header.stageArchived"),
    closed: tEdit("header.stageClosed"),
    forecasted: tEdit("header.stageForecasted"),
    posted: tEdit("header.stagePosted"),
  };
  const opportunityStage = opportunityData.is_draft
    ? tEdit("header.stageDraft")
    : (() => {
        const status = opportunityData.opportunity_status ?? "";
        const label = stageLabels[status];
        if (!label) {
          throw new Error(`Unexpected opportunity status: ${status}`);
        }
        return label;
      })();
  const pageTitle = tEdit("header.pageTitle", {
    number: opportunityData.opportunity_number ?? "",
  });
  const opportunityKeyInformation = {
    title: opportunityData.opportunity_title || "",
    agency: opportunityData.agency_name || opportunityData.agency_code || "",
    assistanceListings:
      primaryAssistanceListing?.assistance_listing_number || "",
    opportunityNumber: opportunityData.opportunity_number || "",
    opportunityStage,
    awardSelectionMethod: opportunityData.category || "",
    awardSelectionMethodExplanation: opportunityData.category_explanation || "",
  };
  const rawLastUpdated =
    [opportunityData.updated_at, activeSummary?.updated_at]
      .filter(Boolean)
      .sort()
      .at(-1) || "";
  const lastUpdated = rawLastUpdated
    ? new Date(rawLastUpdated).toLocaleDateString(locale, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";
  const navigationItems = [
    { text: tEdit("sections.keyInformation"), href: "key-information" },
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
      <section className="bg-base-lightest border-bottom border-base-lightest padding-y-6">
        <div className="grid-container">
          <div className="display-flex flex-column width-full">
            <div className="maxw-tablet-lg margin-bottom-2">
              <h1 className="margin-0 font-heading-2xl">{pageTitle}</h1>
            </div>
            <div className="display-flex flex-column width-full desktop:display-flex desktop:flex-row desktop:flex-justify desktop:flex-align-end">
              <div className="display-flex flex-column maxw-mobile-lg">
                <div className="font-sans-md line-height-sans-5 margin-bottom-2">
                  <span className="text-bold">
                    {tEdit("header.lastUpdated")}
                  </span>{" "}
                  {lastUpdated}
                </div>
                <div className="display-flex flex-align-center">
                  <span className="text-bold font-sans-md line-height-sans-5 margin-right-1">
                    {tEdit("header.status")}
                  </span>
                  <span className="display-inline-flex flex-align-center bg-accent-warm text-ink padding-y-05 padding-x-1 radius-sm">
                    <USWDSIcon
                      name="schedule"
                      className="usa-icon width-2 height-2 margin-right-05"
                    />
                    {opportunityKeyInformation.opportunityStage}
                  </span>
                </div>
              </div>
              <div className="display-flex flex-wrap flex-align-center margin-top-2 desktop:margin-top-0">
                <Button
                  type="submit"
                  form="opportunity-edit-form"
                  outline
                  className="height-auto margin-0 margin-bottom-1 margin-right-105 font-sans-sm text-bold line-height-sans-1"
                >
                  {tEdit("header.saveButton")}
                </Button>
                <OpportunityEditHeaderActions
                  opportunityId={opportunityData.opportunity_id}
                  initialValues={initialValues}
                  previewLabel={tEdit("header.previewButton")}
                  publishLabel={tEdit("header.publishButton")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-container padding-bottom-4">
        <div className="usa-in-page-nav-container">
          <ApplyFormNav
            title={tEdit("header.navTitle")}
            fields={navigationItems}
          />

          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <OpportunityEditForm
              opportunityId={opportunityData.opportunity_id}
              opportunitySummaryId={opportunitySummaryId}
              isForecast={!!opportunityData.forecast_summary}
              initialValues={initialValues}
              isDraft={!!opportunityData.is_draft}
              opportunityKeyInformation={opportunityKeyInformation}
              isNewlyCreated={isNewlyCreated}
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
