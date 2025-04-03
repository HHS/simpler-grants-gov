import EventsCoding from "./EventsCoding";
import EventsDemo from "./EventsDemo";
import EventsHero from "./EventsHero";
import EventsUpcoming from "./EventsUpcoming";

export default function Events() {
  return (
    <>
      <EventsHero />
      <EventsUpcoming />
      <EventsDemo />
      <EventsCoding />
    </>
  );
}
