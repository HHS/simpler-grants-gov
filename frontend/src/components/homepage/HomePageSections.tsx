import HomepageHero from "src/components/homepage/sections/HomepageHero";

import HomepageBuilding from "./sections/HomepageBuilding";
import HomepageExperimental from "./sections/HomepageExperimental";
import HomepageInvovled from "./sections/HomepageInvolved";

export default function HomePageSections() {
  return (
    <>
      <HomepageHero />
      <HomepageExperimental />
      <HomepageBuilding />
      <HomepageInvovled />
    </>
  );
}