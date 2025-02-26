import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function RoadmapHeader() {
  const t = useTranslations("Roadmap");

  return (
    <div className="text-white bg-primary-darkest">
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 6 }}>
            <h1>{t("pageHeaderTitle")}</h1>
            <p>{t("pageHeaderParagraph")}</p>
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
}
