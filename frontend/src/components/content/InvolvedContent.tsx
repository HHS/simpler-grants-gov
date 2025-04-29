import { useTranslations } from "next-intl";
import { USWDSIcon } from "src/components/USWDSIcon";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const codeLink = "https://wiki.simpler.grants.gov/get-involved/github-code"
const discourseLink = "https://simplergrants.discourse.group/"
const participateLink = "https://ethn.io/91822"

const InvolvedContent = () => {
  const t = useTranslations("Involved");

  return (
    <GridContainer data-testid="involved-content"
    className="padding-y-6">
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
              <USWDSIcon
                name="code"
                className="usa-icon--size-4 text-middle"
                aria-label="code-icon"
              />
              <h3>{t("technicalTitle")}</h3>
              <p className="font-sans-md line-height-sans-4">{t("technicalDescription")}</p>
              <a href={codeLink}className="font-sans-md line-height-sans-4"
              target="_blank"
              rel="noopener noreferrer">
                {t("technicalLink")}
              </a>
              <br />
              <a href={discourseLink} className="font-sans-md line-height-sans-4"
              target="_blank"
              rel="noopener noreferrer">
                {t("discourseLink")}
              </a>
            </Grid>
            <Grid col={6}>
              <USWDSIcon
                name="chat"
                className="usa-icon--size-4 text-middle"
                aria-label="chat-icon"
              />
              <h3>{t("participateTitle")}</h3>
              <p className="font-sans-md line-height-sans-4">{t("participateDescription")}</p>
              <a
                href={participateLink}
                target="_blank"
                rel="noopener noreferrer">
                {t("participateLink")}
              </a>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default InvolvedContent;
