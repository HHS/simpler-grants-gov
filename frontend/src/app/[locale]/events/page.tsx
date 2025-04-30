import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import EventsCoding from "./EventsCoding";
import EventsDemo from "./EventsDemo";
import EventsHero from "./EventsHero";
import EventsUpcoming from "./EventsUpcoming";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Events.pageTitle"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Events({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <EventsHero />
      <EventsUpcoming />
      <div className="bg-base-lightest">
        <EventsDemo />
        <EventsCoding />
      </div>
    </>
  );
}
