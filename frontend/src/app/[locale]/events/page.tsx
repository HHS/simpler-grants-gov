import EventsCoding from "./EventsCoding";
import EventsDemo from "./EventsDemo";
import EventsHero from "./EventsHero";
import EventsUpcoming from "./EventsUpcoming";

export default function Events(_p0: { params: Promise<{ locale: string; }>; }) {
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
