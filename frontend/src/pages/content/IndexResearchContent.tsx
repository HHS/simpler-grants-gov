import { Trans, useTranslation } from "next-i18next";
import Image from "next/image";
import Link from "next/link";
import { Button, Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import embarrassed from "../../../public/img/noun-embarrassed.svg";
import goal from "../../../public/img/noun-goal.svg";
import hiring from "../../../public/img/noun-hiring.svg";
import leadership from "../../../public/img/noun-leadership.svg";

const IndexResearchContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <ContentLayout title={t("research.title")} data-testid="research-content">
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
        <p className="usa-intro">{t("research.paragraph_1")}</p>
        <Link href="/process" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            {t("research.cta")}{" "}
            <Icon.ArrowForward
              className="text-middle"
              size={4}
              aria-label="arrow forward"
            />
          </Button>
        </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("research.title_2")}
        </h3>
        <Grid row gap={2}>
          <Grid className="maxw-10" col={2}>
            <Image
              className="height-auto"
              style={{ filter: "invert(33%)" }}
              src={embarrassed as string}
              alt="embarrased"
              priority={false}
            />
          </Grid>
          <Grid col={10}>
            <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans t={t} i18nKey="research.paragraph_2" />
            </p>
          </Grid>
        </Grid>
        <Grid row gap={2}>
          <Grid className="maxw-10" col={2}>
            <Image
              className="height-auto"
              style={{ filter: "invert(33%)" }}
              src={leadership as string}
              alt="leadership"
              priority={false}
            />
          </Grid>
          <Grid col={10}>
            <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans t={t} i18nKey="research.paragraph_3" />
            </p>
          </Grid>
        </Grid>
        <Grid row gap={2}>
          <Grid className="maxw-10" col={2}>
            <Image
              className="height-auto"
              style={{ filter: "invert(33%)" }}
              src={goal as string}
              alt="goal"
              priority={false}
            />
          </Grid>
          <Grid col={10}>
            <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans t={t} i18nKey="research.paragraph_4" />
            </p>
          </Grid>
        </Grid>
        <Grid row gap={2}>
          <Grid className="maxw-10" col={2}>
            <Image
              className="height-auto"
              style={{ filter: "invert(33%)" }}
              src={hiring as string}
              alt="hiring"
              priority={false}
            />
          </Grid>
          <Grid col={10}>
            <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans t={t} i18nKey="research.paragraph_5" />
            </p>
          </Grid>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default IndexResearchContent;
