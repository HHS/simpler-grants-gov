import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const signUpLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSe3nyLxAIeky3bGydyvuZobrlEGdWrl0YaZBbVmsn7Pu6HhUw/viewform";

export default function EventsUpcoming() {
  const t = useTranslations("Events.upcoming");

  return (
    <GridContainer
      data-testid="events-upcoming-content"
      className="padding-y-4 tablet-lg:padding-y-6"
    >
      <Grid row gap>
        <Grid tablet={{ col: 4 }}>
          <h2>{t("title")}</h2>
        </Grid>
        <Grid tablet={{ col: 8 }}>
          <h3>{t("header")}</h3>
          <p className="font-sans-md">{t("startDate")}</p>
          <p>{t("description")}</p>
          <p>
            <a
              href={signUpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans-md"
            >
              {t("link")}
            </a>
          </p>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
