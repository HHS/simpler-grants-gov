import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getOpportunityForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { notFound, redirect, RedirectType } from "next/navigation";
import { Button } from "@trussworks/react-uswds";

import Breadcrumbs, { Breadcrumb } from "src/components/Breadcrumbs";
import OpportunityEditForm from "src/components/opportunity/OpportunityEditForm";
import { buildOpportunityEditInitialValues } from "src/components/opportunity/opportunityEditFormConfig";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Edit opportunity",
    description:
      "Edit draft opportunity information and non-forecast summary fields.",
  };
}

export function generateStaticParams() {
  return [];
}

function canEditOpportunity(opportunity: GrantorOpportunityDetail) {
  return opportunity.is_draft === true;
}

function formatOpportunityStage(opportunityStatus: string | null | undefined) {
  if (!opportunityStatus) {
    return "";
  }

  const stageLabels: Record<string, string> = {
    archived: "Archived",
    closed: "Closed",
    forecasted: "Forecasted",
    posted: "Open for applications",
  };

  return (
    stageLabels[opportunityStatus] ??
    opportunityStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export default async function OpportunityEditPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session || !session.token) {
    redirect(`/opportunity/${id}`, RedirectType.push);
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
    redirect(
      `/opportunity/${opportunityData.opportunity_id}`,
      RedirectType.push,
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
    {
      title: `${opportunityData.opportunity_title || ""}: ${opportunityData.opportunity_number}`,
      path: `/opportunity/${opportunityData.opportunity_id}/`,
    },
  ];
  const isEditableOpportunity = canEditOpportunity(opportunityData);
  const initialValues = buildOpportunityEditInitialValues(opportunityData);
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
  const lastUpdated =
    opportunityData.summary?.post_date || opportunityData.updated_at || "";
  const navigationItems = [
    "Key information",
    "Funding details",
    "Eligibility",
    "Additional information",
    "Attachments",
  ];
  return (
    <div className="bg-white">
      <section className="bg-base-lightest border-bottom border-base-lightest padding-y-6">
        <div className="grid-container">
          <div className="padding-y-2">
            <Breadcrumbs
              breadcrumbList={breadcrumbs}
              className="padding-y-0 bg-transparent font-sans-sm"
            />
          </div>
          <div className="display-flex flex-column gap-2 width-full">
            <div className="maxw-tablet-lg">
              <h1 className="margin-0 font-heading-2xl">{pageTitle}</h1>
            </div>
            <div className="display-flex flex-column gap-3 width-full desktop:display-flex desktop:flex-row desktop:flex-justify desktop:flex-align-end">
              <div className="display-flex flex-column gap-2 maxw-mobile-lg">
                <div className="font-sans-md line-height-sans-5">
                  <span className="text-bold">Last updated:</span> {lastUpdated}
                </div>
                <div className="display-flex flex-align-center grid-gap-1">
                  <span className="text-bold font-sans-md line-height-sans-5">
                    Status:
                  </span>
                  <span className="display-inline-flex flex-align-center bg-accent-warm text-ink padding-y-05 padding-x-1 radius-sm">
                    <svg
                      className="usa-icon width-2 height-2 margin-right-05"
                      aria-hidden="true"
                      focusable="false"
                      role="img"
                    >
                      <use href="/uswds/img/sprite.svg#schedule" />
                    </svg>
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
        <div className="desktop:display-flex desktop:flex-align-start grid-gap-4 width-full">
          <aside className="display-none desktop:display-block width-card-lg">
            <div className="bg-white radius-lg padding-2 width-full">
              <div className="margin-bottom-2 font-sans-xs line-height-sans-3">
                On this page
              </div>
              <nav aria-label="In-page navigation">
                {navigationItems.map((item, index) => (
                  <div
                    className={
                      index === 0
                        ? "display-flex border-left-05 border-base-dark minh-4"
                        : "display-flex border-left border-base-lighter minh-4"
                    }
                    key={item}
                  >
                    <a
                      className={
                        index === 0
                          ? "display-block text-no-underline width-full padding-y-1 padding-x-2 font-sans-3xs line-height-sans-2"
                          : "display-block text-no-underline width-full padding-y-1 padding-x-2 font-sans-3xs line-height-sans-2 text-primary"
                      }
                      href="#"
                    >
                      {item}
                    </a>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <section className="width-full maxw-tablet-xl padding-top-4">
            <OpportunityEditForm
              opportunityId={opportunityData.opportunity_id}
              opportunitySummaryId={opportunitySummaryId}
              isForecast={opportunityData.is_draft}
              initialValues={initialValues}
              isDraft={isEditableOpportunity}
              opportunityKeyInformation={opportunityKeyInformation}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
