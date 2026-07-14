import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { Alert, Link } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type OpportunityDetailsHeaderProps = {
  opportunityData: GrantorOpportunityDetail;
  locale: string;
  children?: ReactNode;
  isNewlyCreated?: boolean;
  hasBackToOverview?: boolean;
};

export function OpportunityDetailsHeader({
  opportunityData,
  locale,
  children,
  isNewlyCreated = false,
  hasBackToOverview = false,
}: OpportunityDetailsHeaderProps) {
  const t = useTranslations("OpportunityDetailsHeader");

  const opportunityId = opportunityData.opportunity_id;
  const opportunityNumber = opportunityData.opportunity_number ?? "";
  const title = opportunityData.opportunity_title ?? "";
  const agency = opportunityData.top_level_agency_name ?? "";
  const subAgency = opportunityData.agency_name ?? "";

  const rawLastUpdated = [
    opportunityData.updated_at,
    opportunityData.forecast_summary?.updated_at,
    opportunityData.non_forecast_summary?.updated_at,
  ]
    .filter(Boolean)
    .sort()
    .at(-1);

  const lastUpdated = rawLastUpdated
    ? new Date(rawLastUpdated).toLocaleDateString(locale, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <section className="bg-base-lightest padding-y-6">
      <div className="grid-container">
        <div className="display-flex flex-justify">
          <div className="flex-1">
            {hasBackToOverview && (
              <Link href={"../" + opportunityId + "/overview"}>
                {t("backToOverview")}
              </Link>
            )}
            <h1 className="margin-0 font-heading-2xl margin-bottom-2">
              {t("opportunityNumber", { number: opportunityNumber })}
            </h1>
            <p className="margin-0 font-sans-md line-height-sans-5 margin-bottom-1">
              <span className="text-bold">{t("title")}</span> {title || "--"}
            </p>
            <p className="margin-0 font-sans-md line-height-sans-5 margin-bottom-2">
              <span className="text-bold">{t("agency")}</span> {agency || "--"}
              {subAgency ? (
                <>
                  {" | "}
                  <span className="text-bold">{t("subAgency")}</span>{" "}
                  {subAgency}
                </>
              ) : null}
            </p>
            <div className="display-flex flex-align-center gap-1">
              {opportunityData.is_draft && (
                <span className="display-inline-flex flex-align-center bg-accent-warm text-ink padding-y-05 padding-x-1 radius-sm margin-right-1">
                  <USWDSIcon
                    name="schedule"
                    className="usa-icon width-2 height-2 margin-right-05"
                    aria-hidden="true"
                  />
                  {t("draft")}
                </span>
              )}
              {lastUpdated && (
                <span className="font-sans-md line-height-sans-5">
                  <span className="text-bold">{t("lastUpdated")}</span>{" "}
                  {lastUpdated}
                </span>
              )}
            </div>
          </div>
          {children && (
            <div className="display-flex flex-align-end gap-1">{children}</div>
          )}
        </div>
        {isNewlyCreated ? (
          <div className="margin-top-2">
            <Alert
              type="success"
              heading={t("alerts.newOpportunityHeading")}
              headingLevel="h3"
            >
              {t("alerts.newOpportunityBody")}
            </Alert>
          </div>
        ) : null}
      </div>
    </section>
  );
}
