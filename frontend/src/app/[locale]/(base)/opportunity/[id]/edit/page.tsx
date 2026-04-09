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
import Breadcrumbs, { Breadcrumb } from "src/components/Breadcrumbs";
import OpportunityEditForm from "src/components/opportunity/OpportunityEditForm";
import { buildOpportunityEditInitialValues } from "src/components/opportunity/opportunityEditFormConfig";
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

const stageLabels: Record<string, string> = {
  archived: "Archived",
  closed: "Closed",
  forecasted: "Forecasted",
  posted: "Open for applications",
};

function formatOpportunityStage(opportunityStatus: string | null | undefined) {
  if (!opportunityStatus) {
    return "";
  }

  return (
    stageLabels[opportunityStatus] ??
    opportunityStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

async function OpportunityEditPage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isNewlyCreated = resolvedSearchParams.fromCreate === "true";
  const t = await getTranslations({ locale, namespace: "Errors" });

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
  const breadcrumbs: Breadcrumb[] = [
    {
      title: "Home",
      path: "/",
    },
    {
      title: "Opportunities",
      path: "/opportunities",
    },
    ...(isNewlyCreated
      ? [{ title: "Create opportunity", path: "/opportunities/create" }]
      : []),
    {
      title: "Opportunity details",
    },
  ];
  const activeSummary =
    opportunityData.forecast_summary ??
    opportunityData.non_forecast_summary ??
    opportunityData.summary;
  const initialValues = buildOpportunityEditInitialValues({
    ...opportunityData,
    summary: activeSummary,
  });
  const pageTitle = `Opportunity #: ${opportunityData.opportunity_number}`;
  const opportunityKeyInformation = {
    title: opportunityData.opportunity_title || "",
    agency: opportunityData.agency_name || opportunityData.agency_code || "",
    assistanceListings:
      primaryAssistanceListing?.assistance_listing_number || "",
    opportunityNumber: opportunityData.opportunity_number || "",
    opportunityStage: opportunityData.is_draft
      ? "Draft"
      : formatOpportunityStage(opportunityData.opportunity_status),
    awardSelectionMethod: opportunityData.category || "",
    awardSelectionMethodExplanation: opportunityData.category_explanation || "",
  };
  const rawLastUpdated =
    opportunityData.summary?.post_date || opportunityData.updated_at || "";
  const lastUpdated = rawLastUpdated
    ? new Date(rawLastUpdated).toLocaleDateString(locale, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";
  const navigationItems = [
    { text: "Key information", href: "key-information" },
    { text: "Funding details", href: "funding-details" },
    { text: "Eligibility", href: "eligibility" },
    { text: "Additional information", href: "additional-information" },
    { text: "Attachments", href: "attachments" },
  ];
  return (
    <div className="bg-white">
      <section className="bg-base-lightest border-bottom border-base-lightest padding-y-6">
        <div className="grid-container">
          <div className="padding-y-2">
            <Breadcrumbs
              breadcrumbList={breadcrumbs}
              className="bg-transparent"
            />
          </div>
          <div className="display-flex flex-column width-full">
            <div className="maxw-tablet-lg margin-bottom-2">
              <h1 className="margin-0 font-heading-2xl">{pageTitle}</h1>
            </div>
            <div className="display-flex flex-column width-full desktop:display-flex desktop:flex-row desktop:flex-justify desktop:flex-align-end">
              <div className="display-flex flex-column maxw-mobile-lg">
                <div className="font-sans-md line-height-sans-5 margin-bottom-2">
                  <span className="text-bold">Last updated:</span> {lastUpdated}
                </div>
                <div className="display-flex flex-align-center">
                  <span className="text-bold font-sans-md line-height-sans-5 margin-right-1">
                    Status:
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
              <div className="display-flex flex-wrap flex-align-center">
                <Button
                  type="submit"
                  form="opportunity-edit-form"
                  outline
                  className="margin-0 margin-right-105 font-sans-sm text-bold line-height-sans-1"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  outline
                  className="margin-0 margin-right-105 font-sans-sm text-bold line-height-sans-1"
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  className="margin-0 font-sans-sm text-bold line-height-sans-1"
                >
                  Submit for review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-container padding-bottom-4">
        <div className="usa-in-page-nav-container">
          <ApplyFormNav title="On this page" fields={navigationItems} />

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
  "opportunityOff",
  () => redirect("/maintenance"),
);
