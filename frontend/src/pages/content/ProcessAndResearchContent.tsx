import { useTranslation } from "next-i18next";
import Link from "next/link";
import { Button, Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessAndResearchContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

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
            {t("process_and_research.cta_1")}{" "}
            <Icon.ArrowForward
              className="text-middle"
              size={4}
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
            {t("process_and_research.cta_2")}{" "}
            <Icon.ArrowForward
              className="text-middle"
              size={4}
              aria-label="arrow-forward"
            />
          </Button>
        </Link>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessAndResearchContent;
