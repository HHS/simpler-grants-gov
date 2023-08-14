import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const FundingContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer className="bg-base-lightest">
      <Grid row>
        <h2 className="margin-bottom-0">{t("fo_title")}</h2>
      </Grid>
      <Grid row gap="md">
        <Grid tablet={{ col: 6 }}>
          <p>{t("fo_paragraph_1")}</p>
        </Grid>
        <Grid tablet={{ col: 6 }}>
          <p>{t("fo_paragraph_2")}</p>
        </Grid>
      </Grid>
      <Grid>
        <h3>{t("fo_title_2")}</h3>
      </Grid>
      <Grid>
        <p className="usa-intro">{t("fo_paragraph_3")}</p>
      </Grid>
      <Grid row>
        <Grid tablet={{ col: 3 }}>
          <a href="/docs/acl_prototype.pdf" download>
            <img src="/img/acl_prototype.png" height="285px" />
          </a>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <a href="/docs/acf_prototype.pdf" download>
            <img src="/img/acf_prototype.png" height="285px" />
          </a>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <a href="/docs/cdc_prototype.pdf" download>
            <img src="/img/cdc_prototype.png" height="285px" />
          </a>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <a href="/docs/samhsa_prototype.png" download>
            <img src="/img/samhsa_prototype.png" height="285px" />
          </a>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default FundingContent;
