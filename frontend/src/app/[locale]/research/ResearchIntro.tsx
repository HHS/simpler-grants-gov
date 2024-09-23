import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ResearchIntro = () => {
  const t = useTranslations("Research");

  return (
    <ContentLayout
      title={t("intro.title")}
      data-testid="research-intro-content"
      paddingTop={false}
      bottomBorder="light"
    >
      <Grid>
        <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
          {t("intro.content")}
        </p>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchIntro;
