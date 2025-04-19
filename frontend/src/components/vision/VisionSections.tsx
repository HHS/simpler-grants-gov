import VisionGetThere from "src/components/vision/sections/VisionGetThere";
import VisionGoals from "src/components/vision/sections/VisionGoals";
import VisionHeader from "src/components/vision/sections/VisionHeader";
import VisionMission from "src/components/vision/sections/VisionMission";

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
