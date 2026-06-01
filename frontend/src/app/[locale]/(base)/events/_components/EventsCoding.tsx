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
      className="padding-y-4 tablet-lg:padding-y-6"
    >
      <Grid row gap>
        <Grid tablet={{ col: 7 }}>
          <h2>{t("title")}</h2>
          <p>{t("descriptionP1")}</p>
          <p>{t("descriptionP2")}</p>
          <p>
            <a
              href={codingChallengeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans-md line-height-sans-4"
            >
              {t("link")}
            </a>
          </p>
        </Grid>
        <Grid tablet={{ col: 5 }}>
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
