import HomepageBuilding from "./sections/HomepageBuilding";
import HomepageExperimental from "./sections/HomepageExperimental";
import HomepageHero from "./sections/HomepageHero";
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
