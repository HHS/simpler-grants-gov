import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function RoadmapHeader() {
  const t = useTranslations("Roadmap");

  return (
    <div className="text-white bg-primary-darkest padding-top-4 tablet:padding-y-6">
      <GridContainer>
        <Grid row>
          <Grid tablet={{ col: 6 }}>
            <h1 className="font-sans-xl margin-0 margin-bottom-4 tablet:font-sans-2xl maxw-2">
              {t("pageHeaderTitle")}
            </h1>
            <p
              className={
                "font-sans-sm line-height-sans-4 margin-bottom-4 tablet:margin-bottom-0"
              }
            >
              {t("pageHeaderParagraph")}
            </p>
          </Grid>
          <Grid
            className="display-none tablet:display-flex tablet:flex-justify-center tablet:flex-align-center"
            tablet={{ col: 6 }}
          >
            <div className="header-image-container">
              <img
                src="/img/roadmap-header-image.png"
                alt="Picture of person on a journey"
              />
            </div>
          </Grid>
        </Grid>
      </GridContainer>
      <div className="mobile-lg:display-none">
        <img
          src="/img/roadmap-header-image.png"
          alt="Picture of person on a journey"
          className="roadmap-header-img"
        />
      </div>
    </div>
  );
}
