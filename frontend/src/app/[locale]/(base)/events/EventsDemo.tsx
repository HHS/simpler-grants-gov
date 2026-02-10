import EventsDemoImg from "public/img/events-demo.png";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const demoLink = "https://youtu.be/uASJmvcy0aM?si=OniP7Z7KU8ie3FhS";

export default function EventsDemo() {
  const t = useTranslations("Events.demo");

  return (
    <GridContainer
      data-testid="events-demo-content"
      className="padding-y-4 tablet-lg:padding-y-6"
    >
      <Grid row gap>
        <Grid tablet={{ col: 5 }}>
          <Image
            alt="events-img"
            className="height-auto position-relative"
            src={EventsDemoImg}
          />
        </Grid>
        <Grid tablet={{ col: 7 }}>
          <Grid>
            <h2>{t("title")}</h2>
          </Grid>
          <Grid>
            <p className="font-sans-md line-height-sans-4">
              {t("description")}
            </p>
            <h3>{t("watch")}</h3>
            <p>
              <a
                href={demoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans-md line-height-sans-4"
              >
                {t("watchLink")}
              </a>
            </p>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
