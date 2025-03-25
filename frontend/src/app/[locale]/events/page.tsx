import Image from "next/image";
import EventsHeroImg from "public/img/events-hero.jpg";
import Breadcrumbs from "src/components/Breadcrumbs";
import { EVENTS_CRUMBS } from "src/constants/breadcrumbs";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

export default function Events() {
  return (
    <div
      data-testid="events-hero"
      className="events-hero bg-primary-darkest text-white"
    >
      <GridContainer
        className=""
      >
        <Grid>
          <Breadcrumbs breadcrumbList={EVENTS_CRUMBS} />
          <h1>Events</h1>
          <p>From new developments to upcoming opportunities, we want you to be a part of the journey.</p>
          <Image
            alt="events-img"
            className="height-auto position-relative"
            src={EventsHeroImg}
          />
        </Grid>
      </GridContainer>
    </div>
  );
}
