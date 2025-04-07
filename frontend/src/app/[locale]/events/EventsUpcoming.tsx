import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function EventsUpcoming() {
  const t = useTranslations("Events.upcoming");
  const signUpLink =
    "https://docs.google.com/forms/d/e/1FAIpQLSe3nyLxAIeky3bGydyvuZobrlEGdWrl0YaZBbVmsn7Pu6HhUw/viewform";

  return (
    <GridContainer data-testid="events-upcoming-content" className="padding-4">
      <Grid row gap="md">
        <Grid
          tablet={{
            col: 3,
          }}
        >
          <h1 className="margin-left-6">{t("title")}</h1>
        </Grid>
        <Grid
          tablet={{
            col: 9,
          }}
          className="padding-x-6"
        >
          <span className="font-sans-md">{t("start_date")}</span>
          <h2>{t("header")}</h2>
          <p className="font-sans-md line-height-sans-4">{t("description")}</p>
          <a
            href={signUpLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-md"
          >
            {t("link")}
          </a>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
