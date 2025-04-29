import BuildingImage from "public/img/homepage-building.jpg";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const BuildingContent = () => {
  const t = useTranslations("Building");

  return (
    <GridContainer data-testid="building-content">
      <Grid row gap="md" className="padding-6">
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Image
            alt="events-img"
            className="height-auto position-relative padding-right-6 padding-top-3"
            src={BuildingImage}
          />
        </Grid>
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Grid>
            <h1>{t("title")}</h1>
          </Grid>
          <Grid>
            <p className="line-height-sans-3 font-sans-md tablet:font-sans-lg text-balance">
              {t("content1")}
            </p>
            <p className="line-height-sans-3 font-sans-md tablet:font-sans-lg">
              {t("content2")}
            </p>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default BuildingContent;
