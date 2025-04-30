import EventsCollabImg from "public/img/events-collab.jpg";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const codingChallengeLink =
  "https://wiki.simpler.grants.gov/get-involved/community-events/spring-2025-collaborative-coding-challenge";

export default function EventsCoding() {
  const t = useTranslations("Events.codingChallenge");

  return (
    <GridContainer
      data-testid="events-coding-content"
      className="padding-x-4 bg-base-lightest"
    >
      <Grid row gap={6} className="padding-6">
        <Grid
          tablet={{
            col: true,
          }}
        >
          <h2>{t("title")}</h2>
          <p className="font-sans-md line-height-sans-4">
            {t("descriptionP1")}
          </p>
          <p className="font-sans-md line-height-sans-4">
            {t("descriptionP2")}
          </p>
          <a
            href={codingChallengeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-md line-height-sans-4"
          >
            {t("link")}
          </a>
        </Grid>
        <Grid
          tablet={{
            col: true,
          }}
        >
          <Image
            alt="events-img"
            className="height-auto position-relative padding-y-3 padding-left-6"
            src={EventsCollabImg}
          />
        </Grid>
      </Grid>
    </GridContainer>
  );
}
