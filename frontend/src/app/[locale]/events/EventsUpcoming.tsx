import { useTranslations } from "next-intl";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const EventsUpcoming = () => {
  const t = useTranslations("Events");

  return (
    <GridContainer data-testid="events-upcoming" className="padding-4">
      <Grid row gap="md">
        <Grid tablet={{
          col: 3
        }}>
          <h1>{t("upcoming.title")}</h1>
        </Grid>
        <Grid tablet={{
          col: 9
        }}>
          <span className="font-sans-md">
            {t("upcoming.start_date")}
          </span>
          <h2>
            {t("upcoming.header")}
          </h2>
          <p className="font-sans-md line-height-sans-4">
            {t("upcoming.description")}
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSe3nyLxAIeky3bGydyvuZobrlEGdWrl0YaZBbVmsn7Pu6HhUw/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-md"
          >
            {t("upcoming.link")}
          </a>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default EventsUpcoming;
