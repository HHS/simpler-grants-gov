import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionHeader() {
  const t = useTranslations("Vision");

  return (
    <div className="text-white bg-primary-darkest padding-top-2 tablet:padding-y-6">
      <GridContainer>
        <Grid row gap>
          <Grid tablet={{ col: "fill" }}>
            <h1 className="desktop-lg:font-sans-3xl">{t("pageHeaderTitle")}</h1>
            <p className="text-balance font-sans-md tablet:font-sans-lg margin-bottom-4 tablet:margin-bottom-0">
              {t("pageHeaderParagraph")}
            </p>
          </Grid>
          <Grid tablet={{ col: 6 }} tabletLg={{ col: "auto" }}>
            <Grid className="display-flex flex-justify-center flex-align-center margin-x-neg-2 tablet:margin-x-0">
              <Image
                src="/img/statue-of-liberty.jpg"
                alt="Statue-of-liberty"
                priority={false}
                width={493}
                height={329}
                style={{ objectFit: "cover" }}
                className="minh-full width-full"
              />
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
