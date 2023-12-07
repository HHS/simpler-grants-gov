import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import { Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

type ImpactBoxes = {
  title: string;
  content: string;
};

const ResearchImpact = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Research",
  });
  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;

  const boxes: ImpactBoxes[] = t("impact.boxes", { returnObjects: true });

  // Do not render if translations aren't ready as returnObjects and map causes the prerender to fail
  // if (!ready) return <></>;

  return (
    <ContentLayout
      title={t("impact.title")}
      data-testid="research-impact-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid>
        <p className="usa-intro">{t("impact.paragraph_1")}</p>
        <p className="usa-intro text-bold margin-top-4">
          {t("impact.paragraph_2")}
        </p>
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
      <Grid tabletLg={{ col: 8 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("impact.title_2")}
        </h3>
        <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          <Trans
            t={t}
            i18nKey="impact.paragraph_3"
            components={{
              email: (
                <a
                  href={`mailto:${email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              newsletter: <Link href={"/newsletter"} />,
              arrowUpRightFromSquare: (
                <Icon.Launch className="text-middle" aria-label="launch" />
              ),
            }}
          />
        </p>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchImpact;
