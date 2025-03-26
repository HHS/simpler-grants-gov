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
    <>
      <div
        data-testid="events-hero"
        className="events-hero bg-primary-darkest text-white padding-left-6 padding-y-2"
      >
        <Breadcrumbs breadcrumbList={EVENTS_CRUMBS} />
        <GridContainer>
          <Grid row>
            <Grid tablet={{
              col: true
            }}>
              <h1 className="tablet:font-sans-2xl desktop-lg:font-sans-3xl desktop-lg:margin-top-2 text-balance">Events</h1>
              <p className="usa-intro line-height-sans-3 font-sans-md tablet:font-sans-lg text-balance">From new developments to upcoming opportunities, we want you to be a part of the journey.</p>
            </Grid>
            <Grid tablet={{
              col: true
            }}>
              <Image
                alt="events-img"
                className="height-auto position-relative padding-top-2 padding-bottom-4 padding-x-6"
                src={EventsHeroImg}
              />
            </Grid>
          </Grid>
        </GridContainer>
      </div>
      <div data-testid="events-upcoming">
          <GridContainer>
          <Grid row gap="md">
              <Grid col={3}>
                <h1>Upcoming Events</h1>
              </Grid>
              <Grid col={9}>Begins March 10, 2025
              Spring 2025 Collaborative Coding Challenge
              The next Simpler.Grants.gov Coding Challenge gives participants an opportunity to showcase their creativity and coding capabilities while competing for awards from our $4,000 prize pool.
              Sign up to participate</Grid>
            </Grid>
          </GridContainer>
      </div>
      <div className="bg-base-lightest">

      </div>
    </>
  );
}
