import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

const WorkspaceLinkCard = ({
  heading,
  description,
  linkText,
  linkTarget,
}: {
  heading: string;
  description: string;
  linkText: string;
  linkTarget: string;
}) => {
  return (
    <div className="border-base-lighter border-1px padding-2 margin-top-2">
      <h3>{heading}</h3>
      <p>{description}</p>
      <Link href={linkTarget}>
        <Button className="margin-top-2" type="button">
          {linkText}
        </Button>
      </Link>
    </div>
  );
};

export const WorkspaceLinksSection = async () => {
  const t = await getTranslations("UserWorkspace.linksSection");
  return (
    <div className="margin-top-4">
      <h2>{t("heading")}</h2>
      <Grid row gap>
        {/* <Grid tablet={{ col: 4 }}>
          <WorkspaceLinkCard
            heading={t("applications.heading")}
            description={t("applications.description")}
            linkText={t("applications.linkText")}
            linkTarget="/applications"
          />
        </Grid> */}
        <Grid tablet={{ col: 6 }}>
          <WorkspaceLinkCard
            heading={t("savedQueries.heading")}
            description={t("savedQueries.description")}
            linkText={t("savedQueries.linkText")}
            linkTarget="/saved-search-queries"
          />
        </Grid>
        <Grid tablet={{ col: 6 }}>
          <WorkspaceLinkCard
            heading={t("savedOpportunities.heading")}
            description={t("savedOpportunities.description")}
            linkText={t("savedOpportunities.linkText")}
            linkTarget="/saved-opportunities"
          />
        </Grid>
      </Grid>
    </div>
  );
};
