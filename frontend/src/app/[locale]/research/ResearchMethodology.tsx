import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import { USWDSIcon } from "src/components/USWDSIcon";

const ResearchMethodology = () => {
  const t = useTranslations("Research");

  return (
    <ContentLayout
      title={t("methodology.title")}
      data-testid="research-methodology-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid tabletLg={{ col: 6 }}>
        <div className="margin-top-3">
          {t.rich("methodology.paragraph_1", {
            p: (chunks) => (
              <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {chunks}
              </p>
            ),
          })}
        </div>
      </Grid>
      <Grid tabletLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("methodology.title_2")}
        </h3>
        {t.rich("methodology.paragraph_2", {
          ul: (chunks) => (
            <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4 margin-bottom-4">
              {chunks}
            </ul>
          ),
          li: (chunks) => <li>{chunks}</li>,
        })}
        <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("methodology.title_3")}
        </p>
        <Link href="/subscribe" passHref>
          <Button className="margin-bottom-4" type="button" outline>
            <span className="margin-right-4">{t("methodology.cta")}</span>
            <USWDSIcon
              className="usa-icon usa-icon--size-3 text-middle margin-left-neg-3"
              name="arrow_forward"
            />
          </Button>
        </Link>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchMethodology;
