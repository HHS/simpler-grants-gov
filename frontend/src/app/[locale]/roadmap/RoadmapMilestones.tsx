import { useTranslations } from "next-intl";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={<>content</>}
      sectionBackgroundColorClass="bg-base-lightest"
    />
  );
}
