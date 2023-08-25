import { nofoPdfs } from "src/constants/nofoPdfs";

import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import NofoImageLink from "./NofoImageLink";

const FundingContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <div className="bg-base-lightest desktop:padding-y-4 tablet:padding-y-2 padding-y-1">
      <GridContainer>
        <Grid row>
          <h2 className="margin-bottom-0 desktop:font-sans-xl">
            {t("fo_title")}
          </h2>
        </Grid>
        <Grid row gap="lg">
          <Grid tablet={{ col: 6 }}>
            <p className="line-height-sans-4">{t("fo_paragraph_1")}</p>
          </Grid>
          <Grid tablet={{ col: 6 }}>
            <p className="line-height-sans-4">{t("fo_paragraph_2")}</p>
          </Grid>
        </Grid>
        <Grid>
          <h3 className="margin-top-4 desktop:margin-top-6 desktop:font-sans-lg">
            {t("fo_title_2")}
          </h3>
        </Grid>
        <Grid>
          <p className="usa-intro">{t("fo_paragraph_3")}</p>
        </Grid>
        <Grid row gap>
          {nofoPdfs.map((pdf) => (
            <NofoImageLink
              key={pdf.file}
              file={pdf.file}
              image={pdf.image}
              alt={t(`${pdf.alt}`)}
            />
          ))}
        </Grid>
        <Grid row gap="lg" className="margin-top-2 desktop:margin-top-4">
          <Grid tablet={{ col: 6 }}>
            <h2 className="desktop:font-sans-xl">{t("fo_title_3")}</h2>
            <p className="usa-intro">{t("fo_paragraph_4")}</p>
          </Grid>
          <Grid tablet={{ col: 6 }}>
            <h3 className="desktop:font-sans-lg">{t("fo_title_4")}</h3>
            <p className="line-height-sans-4">{t("fo_paragraph_5")}</p>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
};

export default FundingContent;
