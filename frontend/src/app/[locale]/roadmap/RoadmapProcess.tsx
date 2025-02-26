import { useTranslations } from "next-intl";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapProcess() {
  const t = useTranslations("Roadmap.sections.process");
  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={<>content</>}
    />
  );
}
