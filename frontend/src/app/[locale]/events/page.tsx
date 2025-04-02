import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsCollabImg from "public/img/events-collab.jpg";
import EventsDemoImg from "public/img/events-demo.png";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

import EventsHero from "./EventsHero";
import EventsUpcoming from "./EventsUpcoming";

export default function Events() {
  const t = useTranslations("Events");
  return (
    <>
      <EventsHero />
      <EventsUpcoming />
      <div data-testid="events-demo-and-coding" className="bg-base-lightest">
        <GridContainer>
          <Grid row gap="md" className="padding-y-6">
            <Grid tablet={{
              col: true
            }}>
              <Image
                alt="events-img"
                className="height-auto position-relative padding-x-6"
                src={EventsDemoImg}
              />
            </Grid>
            <Grid tablet={{
              col: true
            }}>
              <Grid>
                <h2>
                  {t("demos.title")}
                </h2>
              </Grid>
              <Grid>
                <p className="font-sans-md line-height-sans-4">
                  {t("demos.description")}
                </p>
                <h3 className="padding-top-2">{t("demos.watch")}</h3>
                <a
                  href="https://vimeo.com/1050177794/278fa78e0b?share=copy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans-md line-height-sans-4"
                >
                  {t("demos.watch_link")}
                </a>
              </Grid>
            </Grid>
          </Grid>
          <Grid row gap={6} className="padding-x-6 padding-y-6">
            <Grid tablet={{
              col: true
            }}>
              <h2>
                {t("coding_challenge.title")}
              </h2>              
              <p className="font-sans-md line-height-sans-4">
                {t("coding_challenge.description_p1")}
              </p>
              <p className="font-sans-md line-height-sans-4">
                {t("coding_challenge.description_p2")}
              </p>
              <a
                href="https://wiki.simpler.grants.gov/get-involved/community-events/spring-2025-collaborative-coding-challenge"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans-md line-height-sans-4"
              >
                {t("coding_challenge.link")}
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
      </div>
    </>
  );
}
