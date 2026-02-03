import { useMessages, useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function ResearchParticipantGuide() {
  const t = useTranslations("ResearchParticipantGuide");
  const messages = useMessages() as unknown as IntlMessages;
  const { beforeItems, duringItems } = messages.ResearchParticipantGuide;

  return (
    <>
      <GridContainer className="padding-y-4 grid-container tablet-lg:padding-y-6">
        <h1>{t("h1")}</h1>
        <p className="usa-intro">{t("intro")}</p>
        <Grid row gap className="margin-top-5">
          <Grid tabletLg={{ col: 4 }}>
            <h2>{t("beforeHeader")}</h2>
          </Grid>
          <Grid
            tabletLg={{ col: 8 }}
            className="margin-top-2 margin-bottom-0 tablet-lg:margin-0"
          >
            <ul>
              {beforeItems.map((_beforeItem, beforeItemIdx) => (
                <li key={`before-${beforeItemIdx}`}>
                  {t(`beforeItems.${beforeItemIdx}`)}
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>
        <Grid row gap className="margin-top-5">
          <Grid tabletLg={{ col: 4 }}>
            <h2>{t("duringHeader")}</h2>
          </Grid>
          <Grid
            tabletLg={{ col: 8 }}
            className="margin-top-2 margin-bottom-0 tablet-lg:margin-0"
          >
            <ul>
              {duringItems.map((_duringItem, duringItemIdx) => (
                <li key={`before-${duringItemIdx}`}>
                  {t(`duringItems.${duringItemIdx}`)}
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>
      </GridContainer>
    </>
  );
}
