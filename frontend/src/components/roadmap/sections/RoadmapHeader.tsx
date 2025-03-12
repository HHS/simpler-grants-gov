import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function RoadmapHeader() {
  const t = useTranslations("Roadmap");

  return (
    <div className="text-white bg-primary-darkest padding-top-4 tablet:padding-y-6">
      <GridContainer className="padding-0">
        <Grid row>
          <Grid
            tablet={{ col: 6 }}
            className="grid-container display-flex flex-column flex-justify-center"
          >
            <h1 className="font-sans-xl margin-0 tablet:font-sans-2xl tablet:maxw-2">
              {t("pageHeaderTitle")}
            </h1>
            <p
              className={
                "font-sans-sm line-height-sans-4 margin-bottom-4 tablet:padding-right-2 tablet:margin-bottom-0"
              }
            >
              {t("pageHeaderParagraph")}
            </p>
          </Grid>
          <Grid
            className="tablet:display-flex tablet:flex-justify-end tablet:flex-align-center tablet:grid-container"
            tablet={{ col: 6 }}
          >
            <Grid className="display-flex flex-justify-center flex-align-center  ">
              <Image
                src="/img/roadmap-header-image.png"
                className="minh-full maxh-mobile width-full tablet:maxw-mobile"
                alt="Picture of person on a journey"
                layout="responsive"
                width={360}
                height={350}
              />
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
