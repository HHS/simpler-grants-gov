import { useMessages, useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const ProcessIntro = () => {
  const t = useTranslations("Process");

  const messages = useMessages() as unknown as IntlMessages;
  const keys = Object.keys(messages.Process.intro.boxes);

  return (
    <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 padding-top-0 tablet:padding-top-0 desktop-lg:padding-top-0">
      <h1 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
        {t("intro.title")}
      </h1>
      <Grid row gap>
        <Grid>
          <p className="usa-intro margin-top-2">{t("intro.content")}</p>
        </Grid>
      </Grid>
      <Grid row gap="lg" className="margin-top-2">
        {keys.map((key) => {
          const title = t(`intro.boxes.${key}.title`);
          const content = t.rich(`intro.boxes.${key}.content`, {
            italics: (chunks) => <em>{chunks}</em>,
          });
          return (
            <Grid
              className="margin-bottom-6"
              key={title + "-key"}
              tabletLg={{ col: 4 }}
            >
              <div className="border radius-md border-base-lighter padding-x-205">
                <h3 className="tablet-lg:font-sans-lg">{title}</h3>
                <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  {content}
                </p>
              </div>
            </Grid>
          );
        })}
      </Grid>
    </GridContainer>
  );
};

export default ProcessIntro;
