import { useTranslation } from "next-i18next";
import Image from "next/image";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import embarrassed from "../../../public/img/noun-embarrassed.svg";
import goal from "../../../public/img/noun-goal.svg";
import hiring from "../../../public/img/noun-hiring.svg";
import leadership from "../../../public/img/noun-leadership.svg";

const ResearchArchetypes = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  return (
    <ContentLayout
      title={t("archetypes.title")}
      data-testid="research-archetypes-content"
      titleSize="m"
      bottomBorder="dark"
    >
      <Grid>
        <p className="usa-intro">{t("archetypes.paragraph_1")}</p>
      </Grid>
      <Grid
        className="margin-bottom-2 tablet-lg:margin-bottom-4"
        row
        gap="sm"
        tabletLg={{ col: 6 }}
      >
        <Grid col={3} className="text-center">
          <Image
            className="height-auto margin-top-4 tablet-lg:margin-top-6"
            style={{ filter: "invert(33%)" }}
            src={embarrassed as string}
            alt="embarrased"
            priority={false}
          />
        </Grid>
        <Grid col={9}>
          <h3 className="tablet-lg:font-sans-lg">
            {t("archetypes.novice.title")}
          </h3>
          <p className="usa-intro margin-top-0">
            {t("archetypes.novice.paragraph_1")}
          </p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("archetypes.novice.paragraph_2")}
          </p>
        </Grid>
      </Grid>
      <Grid
        className="margin-bottom-2 tablet-lg:margin-bottom-4"
        row
        gap="sm"
        tabletLg={{ col: 6 }}
      >
        <Grid col={3} className="text-center">
          <Image
            className="height-auto margin-top-4 tablet-lg:margin-top-6"
            style={{ filter: "invert(33%)" }}
            src={leadership as string}
            alt="leadership"
            priority={false}
          />
        </Grid>
        <Grid col={9}>
          <h3 className="tablet-lg:font-sans-lg">
            {t("archetypes.collaborator.title")}
          </h3>
          <p className="usa-intro margin-top-0">
            {t("archetypes.collaborator.paragraph_1")}
          </p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("archetypes.collaborator.paragraph_2")}
          </p>
        </Grid>
      </Grid>
      <Grid
        className="margin-bottom-2 tablet-lg:margin-bottom-4"
        row
        gap="sm"
        tabletLg={{ col: 6 }}
      >
        <Grid col={3} className="text-center">
          <Image
            className="height-auto margin-top-4 tablet-lg:margin-top-6"
            style={{ filter: "invert(33%)" }}
            src={goal as string}
            alt="goal"
            priority={false}
          />
        </Grid>
        <Grid col={9}>
          <h3 className="tablet-lg:font-sans-lg">
            {t("archetypes.maestro.title")}
          </h3>
          <p className="usa-intro margin-top-0">
            {t("archetypes.maestro.paragraph_1")}
          </p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("archetypes.maestro.paragraph_2")}
          </p>
        </Grid>
      </Grid>
      <Grid
        className="margin-bottom-2 tablet-lg:margin-bottom-4"
        row
        gap="sm"
        tabletLg={{ col: 6 }}
      >
        <Grid col={3} className="text-center">
          <Image
            className="height-auto margin-top-4 tablet-lg:margin-top-6"
            style={{ filter: "invert(33%)" }}
            src={hiring as string}
            alt="hiring"
            priority={false}
          />
        </Grid>
        <Grid col={9}>
          <h3 className="tablet-lg:font-sans-lg">
            {t("archetypes.supervisor.title")}
          </h3>
          <p className="usa-intro margin-top-0">
            {t("archetypes.supervisor.paragraph_1")}
          </p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("archetypes.supervisor.paragraph_2")}
          </p>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchArchetypes;
