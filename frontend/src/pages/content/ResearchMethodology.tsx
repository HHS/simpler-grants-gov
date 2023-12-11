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
        <div className="margin-top-3">
          <Trans
            t={t}
            i18nKey={"methodology.paragraph_1"}
            components={{
              p: (
                <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6" />
              ),
            }}
          />
        </div>
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
              <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4 margin-bottom-4" />
            ),
            li: <li />,
          }}
        />
        <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("methodology.title_3")}
        </p>
        <Link href="/newsletter" passHref>
          <Button className="margin-bottom-4" type="button" outline>
            {t("methodology.cta")}{" "}
            <Icon.ArrowForward
              className="text-middle"
              aria-label="arror-forward"
            />
          </Button>
        </Link>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchMethodology;
