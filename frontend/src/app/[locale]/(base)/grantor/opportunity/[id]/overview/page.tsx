import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

//import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@trussworks/react-uswds";

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams?: Promise<Record<string, string>>;
};

async function OpportunityOverviewPage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  //const t = useTranslations("OpportunityOverview");
  const t = await getTranslations({ locale, namespace: "OpportunityOverview" });
  const editUrl = "../" + id + "/edit";
  const competitionUrl = "../" + id + "/competition";

  return (
    <div className="bg-white">
      {/* TODO: header here */}
      <div className="grid-container padding-top-4 padding-bottom-4">
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={editUrl}>{t("labels.editOpportunityLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* TODO: status button here */}
          </div>
        </div>
        <hr />
        <div className="grid-row grid-gap-2 padding-top-2">
          <div className="tablet:grid-col">
            <Link href={competitionUrl}>{t("labels.competitionLink")}</Link>
          </div>
          <div className="tablet:grid-col">
            {/* TODO: status button here */}
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
