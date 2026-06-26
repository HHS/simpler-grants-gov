import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Alert, Link } from "@trussworks/react-uswds";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams?: Promise<Record<string, string>>;
};

async function OpportunityOverviewPage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isNewlyCreated = resolvedSearchParams.fromCreate === "true";
  const t = await getTranslations({ locale, namespace: "OpportunityOverview" });
  const editUrl = "../" + id + "/edit";
  const competitionUrl = "../" + id + "/competition";

  return (
    <div className="bg-white">
      {/* PLACEHOLDER: header here */}
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
      <div className="grid-container padding-top-4 padding-bottom-4">
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={editUrl}>{t("labels.editOpportunityLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* PLACEHOLDER: status icon here */}
          </div>
        </div>
        <hr />
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={competitionUrl}>{t("labels.competitionLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* PLACEHOLDER: status icon here */}
          </div>
        </div>
        <hr />
      </div>
    </div>
  );
}

export default withFeatureFlag<PageProps, never>(
  OpportunityOverviewPage,
  "opportunitiesListOff",
  () => redirect("/maintenance"),
);
