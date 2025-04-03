import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsCollabImg from "public/img/events-collab.jpg";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

const EventsDemo = () => {
  const t = useTranslations("Events.coding_challenge");

  return (
    <GridContainer
      data-testid="events-coding-content" className="padding-x-4 bg-base-lightest">
      <Grid row gap={6} className="padding-x-6 padding-y-6">
        <Grid tablet={{
          col: true
        }}>
          <h2>
            {t("title")}
          </h2>
          <p className="font-sans-md line-height-sans-4">
            {t("description_p1")}
          </p>
          <p className="font-sans-md line-height-sans-4">
            {t("description_p2")}
          </p>
          <a
            href="https://wiki.simpler.grants.gov/get-involved/community-events/spring-2025-collaborative-coding-challenge"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-md line-height-sans-4"
          >
            {t("link")}
          </a>
        </Grid>
        <Grid tablet={{
          col: true
        }}>
          <Image
            alt="events-img"
            className="height-auto position-relative padding-left-6"
            src={EventsCollabImg}
          />
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default EventsDemo;
