import { useTranslations } from "next-intl";
import ContentLayout from "src/components/ContentLayout";

import {
  Button,
  Grid,
} from "@trussworks/react-uswds";

import IconInfo from "./IconInfo";

const trySearchLink: string = "https://simpler.grants.gov/search";
const subscribeLink: string = "https://simpler.grants.gov/subscribe";

const ExperimentalContent = () => {
  const t = useTranslations("Experimental");

  return (
    <ContentLayout data-testid="experimental-content" bottomBorder="light">
      <Grid row gap="md">
        <Grid
          tablet={{
            col: 4,
          }}
        >
          <h1>{t("title")}</h1>
        </Grid>
        <Grid
          tablet={{
            col: 8,
          }}
          className="padding-x-6"
        >
          <h2>{t("header")}</h2>
          <h3>{t("subheader1")}</h3>
          <p className="font-sans-md line-height-sans-4">{t("content1")}</p>
          <a 
            href={trySearchLink}
            target="_blank"
            rel="noopener noreferrer">
            <Button
              className="margin-y-2" 
              type="button"
              size="big">
                {t("tryLink")}
            </Button>
          </a>
          <h3>{t("subheader2")}</h3>
          <p className="font-sans-md line-height-sans-4">{t("content2")}</p>
          <Grid row className="padding-y-2" gap="md">
            <Grid col={6}>
              <IconInfo
                description={t("feedbackDescription")}
                iconName="build"
                link="mailto:simpler@grants.gov"
                linkText={t("feedbackLink")}
                title={t("feedbackTitle")}
              />
            </Grid>
            <Grid col={6}>
              <IconInfo
                description={t("newFeaturesDescription")}
                iconName="mail"
                link={subscribeLink}
                linkText={t("newFeaturesLink")}
                title={t("newFeaturesTitle")}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ExperimentalContent;
