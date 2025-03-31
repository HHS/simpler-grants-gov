import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

export default function VisionIntro() {
  const t = useTranslations("Vision.intro");

  return (
    <Grid row className="text-white bg-mint-70">
      <ContentLayout
        title={t("title_1")}
        data-testid="vision-intro-content"
        titleSize="l"
      >
        <Grid col>
          <p className="usa-intro">{t("content_1")}</p>
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
      </ContentLayout>
    </Grid>
  );
}
