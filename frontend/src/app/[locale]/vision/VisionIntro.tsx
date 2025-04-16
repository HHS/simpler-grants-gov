import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionIntro() {
  const t = useTranslations("Vision.intro");

  return (
    <div className="bg-mint-70 padding-10">
      <GridContainer className="bg-mint-70">
        <Grid row className="text-white bg-mint-70">
          <Grid col>
            <h1 className="usa-title font-sans-3xl">{t("title_1")}</h1>
            <p className="usa-intro measure-6 line-height-sans-2">
              {t("content_1")}
            </p>
          </Grid>
          <Grid col className="padding-left-4">
            <Image
              className="width-auto height-auto"
              src="/img/statue-of-liberty.jpg"
              alt="Statue-of-liberty"
              priority={false}
              width="400"
              height="400"
            />
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
