import { Metadata } from "next";
import { SAVED_GRANTS_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button, Grid, GridContainer, Icon } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { USWDSIcon } from "src/components/USWDSIcon";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedGrants.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

// TODO: layout with breadcrumbs and such
// HOw to handle redirecting user away on logout?
export default async function SavedGrants({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_GRANTS_CRUMBS} />
      <GridContainer>
        <h1 className="tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
          {t("SavedGrants.heading")}
        </h1>
      </GridContainer>
      <div className="bg-base-lightest">
        <div className="grid-container padding-y-5 display-flex">
          <USWDSIcon
            name="star_outline"
            className="grid-col-1 usa-icon usa-icon--size-6 margin-top-4"
          />
          <div className="margin-top-2 grid-col-11">
            <p className="usa-intro ">
              {t.rich("SavedGrants.noSavedCTA", {
                br: () => (
                  <>
                    <br />
                    <br />
                  </>
                ),
              })}
            </p>
            <Link href="/search">
              <Button type="button">{t("SavedGrants.searchButton")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
