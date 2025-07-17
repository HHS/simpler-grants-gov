import RoadmapHeader from "./sections/RoadmapHeader";
import RoadmapMilestones from "./sections/RoadmapMilestones";
import RoadmapProcess from "./sections/RoadmapProcess";
import RoadmapTimeline from "./sections/RoadmapTimeline";
import RoadmapWhatWereWorkingOn from "./sections/RoadmapWhatWereWorkingOn";

export default function RoadmapPageSections() {
  return (
    <>
      <RoadmapHeader />
      <RoadmapTimeline />
      <RoadmapWhatWereWorkingOn />
      <RoadmapMilestones />
      <RoadmapProcess />
    </>
  );
}
