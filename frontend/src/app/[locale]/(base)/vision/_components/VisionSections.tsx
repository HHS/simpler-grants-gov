import VisionGetThere from "src/app/[locale]/(base)/vision/_components/sections/VisionGetThere";
import VisionGoals from "src/app/[locale]/(base)/vision/_components/sections/VisionGoals";
import VisionHeader from "src/app/[locale]/(base)/vision/_components/sections/VisionHeader";
import VisionMission from "src/app/[locale]/(base)/vision/_components/sections/VisionMission";

export default function VisionPageSections() {
  return (
    <>
      <VisionHeader />
      <VisionMission />
      <VisionGoals />
      <VisionGetThere />
    </>
  );
}
