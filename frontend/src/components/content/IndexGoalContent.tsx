import { useTranslations } from "next-intl";

import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";
import { USWDSIcon } from "../USWDSIcon";
import ContentLayout from "src/components/ContentLayout";

const IndexGoalContent = () => {
  const t = useTranslations("Index");

  return (
    <ContentLayout
      title={t("goal.title")}
      data-testid="goal-content"
      bottomBorder="light"
    >
      <Grid tabletLg={{ col: 6 }}>
        <p className="usa-intro padding-bottom-2">{t("goal.paragraph_1")}</p>
        <Link href="/newsletter" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            <span className="margin-right-5">{t("goal.cta")}</span>
            <USWDSIcon
              name="arrow_forward"
              className="usa-icon usa-icon--size-4 text-middle margin-left-neg-4"
              aria-label="arrow-forward"
            />
          </Button>
        </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("goal.title_2")}
        </h3>
        <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("goal.paragraph_2")}
        </p>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("goal.title_3")}
        </h3>
        <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("goal.paragraph_3")}
        </p>
      </Grid>
    </ContentLayout>
  );
};

export default IndexGoalContent;
