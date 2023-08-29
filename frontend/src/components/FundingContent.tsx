import { nofoPdfs } from "src/constants/nofoPdfs";

import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import NofoImageLink from "./NofoImageLink";

const FundingContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <div className="bg-base-lightest padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6">
      <GridContainer>
        <h2 className="tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("fo_title")}
        </h2>
        <Grid row gap>
          <Grid tabletLg={{ col: 6 }}>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("fo_paragraph_1")}
            </p>
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("fo_paragraph_2")}
            </p>
          </Grid>
        </Grid>

        <h3 className="margin-top-4 tablet-lg:font-sans-xl desktop:margin-top-6">
          {t("fo_title_2")}
        </h3>

        <p className="usa-intro">{t("fo_paragraph_3")}</p>

        <Grid row gap="md" className="margin-y-3 desktop:margin-y-6">
          {nofoPdfs.map((pdf) => (
            <NofoImageLink
              key={pdf.file}
              file={pdf.file}
              image={pdf.image}
              alt={t(`${pdf.alt}`)}
            />
          ))}
        </Grid>

        <Grid row gap>
          <Grid tabletLg={{ col: 6 }}>
            <h2 className="margin-top-0 tablet-lg:font-sans-xl">
              {t("fo_title_3")}
            </h2>
            <p className="usa-intro">{t("fo_paragraph_4")}</p>
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <h3 className="margin-top-0 desktop:font-sans-lg">
              {t("fo_title_4")}
            </h3>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("fo_paragraph_5")}
            </p>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
};

export default FundingContent;
