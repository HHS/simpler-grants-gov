import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import SendyDisclaimer from "src/components/newsletter/SendyDisclaimer";
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
            <Grid tablet={{ col: "fill" }}>
              <h1>{t("title")}</h1>
              <p className="text-balance font-sans-md tablet:font-sans-lg margin-bottom-4 tablet:margin-bottom-0">
                {t("paragraph1")}
              </p>
              <p className="text-balance font-sans-md tablet:font-sans-lg margin-bottom-4 tablet:margin-bottom-0">
                {t("paragraph2")}
              </p>
            </Grid>
            <Grid tablet={{ col: 6 }} tabletLg={{ col: "auto" }}>
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
        <GridContainer className="margin-top-4 tablet-lg:margin-top-6">
          <Grid row gap className="flex-align-start">
            <Grid tabletLg={{ col: 3 }}>
              <h2>{t("formLabel")}</h2>
            </Grid>
            <Grid tabletLg={{ col: 9 }}>
              <SubscriptionForm />
            </Grid>
          </Grid>
        </GridContainer>
        <SendyDisclaimer />
      </div>
    </>
  );
}
