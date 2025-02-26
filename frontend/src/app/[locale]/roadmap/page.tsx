import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import RoadmapPageSection from "./RoadmapPageSection";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Roadmap.pageTitle"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export async function Roadmap({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const headerSection = (
    <div className="text-white bg-primary-darkest">
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 6 }}>
            <h1>{t("Roadmap.pageHeaderTitle")}</h1>
            <p>{t("Roadmap.pageHeaderParagraph")}</p>
          </Grid>
          <Grid
            tablet={{ col: 6 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div>img</div>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );

  const whatWereWorkingOnSection = (
    <RoadmapPageSection
      sectionTitle={t("Roadmap.sections.progress.title")}
      sectionContent={<>content</>}
    />
  );

  const milestonesSection = (
    <RoadmapPageSection
      sectionTitle={t("Roadmap.sections.milestones.title")}
      sectionContent={<>content</>}
      sectionBackgroundColorClass="bg-base-lightest"
    />
  );

  const processSection = (
    <RoadmapPageSection
      sectionTitle={t("Roadmap.sections.process.title")}
      sectionContent={<>content</>}
    />
  );

  return (
    <>
      {headerSection}
      {whatWereWorkingOnSection}
      {milestonesSection}
      {processSection}
    </>
  );
}

export default Roadmap;
