import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapHeader() {
  const t = useTranslations("Roadmap");

  return (
    <>
      <RoadmapPageSection
        sectionContent={
          <GridContainer className="padding-0">
            <Grid row>
              <Grid tablet={{ col: 6 }}>
                <h1>{t("pageHeaderTitle")}</h1>
                <p className={"font-sans-sm line-height-sans-4"}>
                  {t("pageHeaderParagraph")}
                </p>
              </Grid>
              <Grid
                tablet={{ col: 6 }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/img/roadmap-header-image.png"
                  alt="Picture of person on a journey"
                  width={250}
                  height={300}
                />
              </Grid>
            </Grid>
          </GridContainer>
        }
      />
    </>
  );
}
