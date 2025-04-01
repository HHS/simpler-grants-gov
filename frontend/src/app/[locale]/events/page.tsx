import { useTranslations } from "next-intl";
import Image from "next/image";
import EventsHeroImg from "public/img/events-hero.jpg";
import Breadcrumbs from "src/components/Breadcrumbs";
import { EVENTS_CRUMBS } from "src/constants/breadcrumbs";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

export default function Events() {
  const t = useTranslations("Events");
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
              <h1 className="tablet:font-sans-2xl desktop-lg:font-sans-3xl desktop-lg:margin-top-2 text-balance">{t("page_title")}</h1>
              <p className="usa-intro line-height-sans-3 font-sans-md tablet:font-sans-lg text-balance">{t("page_description")}</p>
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
              <Grid tablet={{
                col: 3
              }}>
                <h1>{t("upcoming.title")}</h1>
              </Grid>
            <Grid tablet={{
              col: 9
            }}>{t("upcoming.description")}</Grid>
            </Grid>
          </GridContainer>
      </div>
      <div className="bg-base-lightest">
        <GridContainer>
          <Grid row>
            <Grid>
              {t("demos.title")}
            </Grid>
            <Grid>
              <p>
                {t("demos.description")}
              </p>
            </Grid>
          </Grid>
          <Grid row>
            <Grid>
              {t("coding_challenge.title")}
            </Grid>
            <Grid>
              <p>
                {t("coding_challenge.description")}
              </p>
            </Grid>
            <Grid>
              <p>
                {t("coding_challenge.link")}
              </p>
            </Grid>
          </Grid>
        </GridContainer>
      </div>
    </>
  );
}
