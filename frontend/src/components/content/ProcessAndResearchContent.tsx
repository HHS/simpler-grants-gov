import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import { USWDSIcon } from "src/components/USWDSIcon";

const ProcessAndResearchContent = () => {
  const t = useTranslations("Index");

  return (
    <ContentLayout
      data-testid="process-and-research-content"
      bottomBorder="none"
    >
      <Grid tabletLg={{ col: 6 }}>
        <h2 className="tablet-lg:font-sans-l desktop-lg:font-sans-xl">
          {t("process_and_research.title_1")}
        </h2>
        <p className="font-sans-md line-height-sans-4 padding-bottom-2 desktop-lg:line-height-sans-6">
          {t("process_and_research.paragraph_1")}
        </p>
        <Link href="/process" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            <span className="margin-right-5">
              {t("process_and_research.cta_1")}
            </span>
            <USWDSIcon
              name="arrow_forward"
              className="usa-icon usa-icon--size-4 text-middle margin-left-neg-4"
              aria-label="arrow-forward"
            />
          </Button>
        </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }}>
        <h2 className="tablet-lg:font-sans-l desktop-lg:font-sans-xl">
          {t("process_and_research.title_2")}
        </h2>
        <p className="font-sans-md line-height-sans-4 padding-bottom-2 desktop-lg:line-height-sans-6">
          {t("process_and_research.paragraph_2")}
        </p>
        <Link href="research" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            <span className="margin-right-5">
              {t("process_and_research.cta_2")}
            </span>
            <USWDSIcon
              name="arrow_forward"
              className="usa-icon usa-icon--size-4 text-middle margin-left-neg-4"
              aria-label="arrow-forward"
            />
          </Button>
        </Link>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessAndResearchContent;
