import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import { Button, Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ResearchMethodology = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  return (
    <ContentLayout
      title={t("methodology.title")}
      data-testid="research-methodology-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid tabletLg={{ col: 6 }}>
        <p className="usa-intro">{t("methodology.paragraph_1")}</p>
      </Grid>
      <Grid tabletLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("methodology.title_2")}
        </h3>
        <Trans
          t={t}
          i18nKey="methodology.paragraph_2"
          components={{
            ul: (
              <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4 margin-bottom-2" />
            ),
            li: <li />,
          }}
        />
        <h3 className="tablet-lg:font-sans-lg margin-top-4 margin-bottom-2">
          {t("methodology.title_3")}
        </h3>
        <Link href="/#" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            {t("methodology.cta")}{" "}
            <Icon.Launch className="text-middle" size={4} aria-label="launch" />
          </Button>
        </Link>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchMethodology;
