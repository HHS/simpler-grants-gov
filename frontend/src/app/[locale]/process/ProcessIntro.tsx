import { useMessages, useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessIntro = () => {
  const t = useTranslations("Process");

  const messages = useMessages() as unknown as IntlMessages;
  const keys = Object.keys(messages.Process.intro.boxes);

  return (
    <ContentLayout
      title={t("intro.title")}
      data-testid="process-intro-content"
      paddingTop={false}
    >
      <Grid row gap>
        <Grid>
          <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
            {t("intro.content")}
          </p>
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
                <h3 className="tablet-lg:font-serif-lg">{title}</h3>
                <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  {content}
                </p>
              </div>
            </Grid>
          );
        })}
      </Grid>
    </ContentLayout>
  );
};

export default ProcessIntro;
