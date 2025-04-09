import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsHeroImg from "public/img/events-hero.jpg";
import Breadcrumbs from "src/components/Breadcrumbs";
import { EVENTS_CRUMBS } from "src/constants/breadcrumbs";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

export default function EventsHero() {
  const t = useTranslations("Events");

  return (
    <div
      data-testid="events-hero"
      className="events-hero bg-primary-darkest text-white padding-left-6 padding-y-2"
    >
      <Breadcrumbs breadcrumbList={EVENTS_CRUMBS} />
      <GridContainer>
        <Grid row>
          <Grid
            tablet={{
              col: true,
            }}
          >
            <h1 className="tablet:font-sans-2xl desktop-lg:font-sans-3xl desktop-lg:margin-top-2 text-balance">
              {t("pageTitle")}
            </h1>
            <p className="usa-intro font-sans-md tablet:font-sans-lg line-height-sans-4 text-balance">
              {t("pageDescription")}
            </p>
          </Grid>
          <Grid
            tablet={{
              col: true,
            }}
          >
            <Image
              alt="events-img"
              className="height-auto position-relative padding-top-2 padding-bottom-4 padding-x-6"
              src={EventsHeroImg}
            />
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
