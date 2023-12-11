import { useTranslation } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

type IntroBoxes = {
  title: string;
  content: string;
};

const ProcessIntro = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  const boxes: IntroBoxes[] = t("intro.boxes", { returnObjects: true });

  return (
    <ContentLayout
      title={t("intro.title")}
      data-testid="process-intro-content"
      paddingTop={false}
    >
      <Grid row gap>
        <Grid>
          <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
            {t("intro.content")}
          </p>
        </Grid>
      </Grid>

      <Grid row gap="lg" className="margin-top-2">
        {!Array.isArray(boxes)
          ? ""
          : boxes.map((box) => {
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

export default ProcessIntro;
