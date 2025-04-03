import { useTranslations } from "next-intl";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const EventsUpcoming = () => {
  const t = useTranslations("Events.upcoming");

  return (
    <GridContainer data-testid="events-upcoming-content" className="padding-4">
      <Grid row gap="md">
        <Grid tablet={{
          col: 3
        }}>
          <h1>{t("title")}</h1>
        </Grid>
        <Grid tablet={{
          col: 9
        }}>
          <span className="font-sans-md">
            {t("start_date")}
          </span>
          <h2>
            {t("header")}
          </h2>
          <p className="font-sans-md line-height-sans-4">
            {t("description")}
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSe3nyLxAIeky3bGydyvuZobrlEGdWrl0YaZBbVmsn7Pu6HhUw/viewform"
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
};

export default EventsUpcoming;
