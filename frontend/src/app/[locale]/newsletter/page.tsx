import { NEWSLETTER_CRUMBS } from "src/constants/breadcrumbs";

import { Grid, GridContainer } from "@trussworks/react-uswds";
import pick from "lodash/pick";
import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "src/components/BetaAlert";
import NewsletterForm from "src/app/[locale]/newsletter/NewsletterForm";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  useTranslations,
  useMessages,
  NextIntlClientProvider,
} from "next-intl";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Newsletter.page_title"),
    description: t("Index.meta_description"),
  };

  return meta;
}

export default function Newsletter() {
  const t = useTranslations("Newsletter");
  const messages = useMessages();

  return (
    <>
      <PageSEO title={t("page_title")} description={t("intro")} />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={NEWSLETTER_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("title")}
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl margin-bottom-0">
          {t("intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p className="usa-intro">{t("paragraph_1")}</p>
            {t.rich("list", {
              ul: (chunks) => (
                <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4">
                  {chunks}
                </ul>
              ),
              li: (chunks) => <li>{chunks}</li>,
            })}
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <NextIntlClientProvider
              locale="en"
              messages={pick(messages, "Newsletter")}
            >
              <NewsletterForm />
            </NextIntlClientProvider>
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
      </GridContainer>
    </>
  );
}
