import { useTranslation } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

type ImpactBoxes = {
  title: string;
  content: string;
};

const ResearchImpact = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  const boxes: ImpactBoxes[] = t("impact.boxes", { returnObjects: true });

  return (
    <ContentLayout
      title={t("impact.title")}
      data-testid="research-impact-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid>
        <p className="usa-intro">{t("impact.paragraph_1")}</p>
        <p className="usa-intro text-bold">{t("impact.paragraph_2")}</p>
      </Grid>
      <Grid row gap="lg">
        {boxes.map((box) => {
          return (
            <Grid
              className="margin-bottom-6"
              key={box.title + "-key"}
              tabletLg={{ col: 4 }}
            >
              <div className="border radius-md border-base-lighter padding-x-205">
                <h3 className="tablet-lg:font-serif-lg">{box.title}</h3>
                <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  {box.content}
                </p>
              </div>
            </Grid>
          );
        })}
      </Grid>
    </ContentLayout>
  );
};

export default ResearchImpact;
