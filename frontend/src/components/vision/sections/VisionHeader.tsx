import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionHeader() {
  const t = useTranslations("Vision");

  return (
    <div className="text-white bg-primary-darkest padding-top-4 tablet:padding-y-6">
      <GridContainer className="padding-0">
        <Grid row>
          <Grid
            tablet={{ col: 6 }}
            className="grid-container display-flex flex-column"
          >
            <h1 className="font-sans-xl margin-0 tablet:font-sans-3xl tablet-lg:font-sans-3xl">
              {t("pageHeaderTitle")}
            </h1>
            <p
              className={
                "font-sans-sm line-height-sans-4 margin-bottom-4 tablet:font-sans-md tablet:padding-right-1 tablet:margin-bottom-0 tablet-lg:font-sans-lg"
              }
            >
              {t("pageHeaderParagraph")}
            </p>
          </Grid>
          <Grid
            className="tablet:display-flex tablet:flex-justify-end tablet:flex-align-center tablet:grid-container"
            tablet={{ col: 6 }}
          >
            <Grid className="display-flex flex-justify-center flex-align-center">
              <Image
                src="/img/statue-of-liberty.jpg"
                alt="Statue-of-liberty"
                priority={false}
                width={493}
                height={329}
                style={{ objectFit: "cover" }}
                className="minh-full width-full desktop:padding-right-2"
              />
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
