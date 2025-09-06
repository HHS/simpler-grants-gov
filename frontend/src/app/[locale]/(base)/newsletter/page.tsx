import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import SubscriptionForm from "src/components/newsletter/SubscriptionForm";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Subscribe.pageTitle"),
    description: t("Subscribe.metaDescription"),
  };

  return meta;
}

export default function Subscribe({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Subscribe");

  return (
    <>
      <div className="text-white bg-primary-darkest padding-top-2 tablet:padding-y-6">
        <GridContainer>
          <Grid row gap>
            <Grid
              tablet={{ col: "fill" }}
              className="tablet:margin-bottom-0 margin-bottom-4"
            >
              <h1>{t("title")}</h1>
              <div className="font-sans-md">
                <p>{t("paragraph1")}</p>
                <p>{t("paragraph2")}</p>
              </div>
            </Grid>
            <Grid tablet={{ col: "auto" }}>
              <Grid className="display-flex flex-justify-center flex-align-center margin-x-neg-2 tablet:margin-x-0">
                <Image
                  src="/img/statue-of-liberty-blue.png"
                  alt="Statue-of-liberty"
                  priority={false}
                  width={493}
                  height={329}
                  style={{ objectFit: "cover" }}
                  className="minh-full width-full"
                />
              </Grid>
            </Grid>
          </Grid>
        </GridContainer>
      </div>
      <div>
        <GridContainer className="padding-y-4 tablet-lg:padding-y-6">
          <Grid row gap className="flex-align-start">
            <Grid tabletLg={{ col: 3 }}>
              <h2>{t("formLabel")}</h2>
            </Grid>
            <Grid tabletLg={{ col: 9 }}>
              <SubscriptionForm />
            </Grid>
          </Grid>
        </GridContainer>
      </div>
    </>
  );
}
