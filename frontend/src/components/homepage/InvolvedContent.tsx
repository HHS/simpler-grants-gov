import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import IconInfo from "./IconInfo";

const codeLink = "https://wiki.simpler.grants.gov/get-involved/github-code";
const discourseLink = "https://simplergrants.discourse.group/";
const participateLink = "https://ethn.io/91822";

const InvolvedContent = () => {
  const t = useTranslations("Involved");

  return (
    <GridContainer data-testid="involved-content" className="padding-y-6">
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
          <Grid row className="padding-y-2" gap="md">
            <Grid col={6}>
              <IconInfo
                description={t("technicalDescription")}
                iconName="code"
                link={codeLink}
                linkText={t("technicalLink")}
                title={t("technicalTitle")}
              />
              <br />
              <a
                href={discourseLink}
                className="font-sans-md line-height-sans-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("discourseLink")}
              </a>
            </Grid>
            <Grid col={6}>
              <IconInfo
                description={t("participateDescription")}
                iconName="chat"
                link={participateLink}
                linkText={t("participateLink")}
                title={t("participateTitle")}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default InvolvedContent;
