import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "./RoadmapPageSection";

export default function RoadmapProcess() {
  const t = useTranslations("Roadmap.sections.process");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems } = messages.Roadmap.sections.process;

  return (
    <RoadmapPageSection
      sectionTitle={t("title")}
      sectionContent={
        <div>
          <p>{t("sectionSummary")}</p>
          {Object.keys(contentItems).map((key) => {
            return (
              <div>
                <h3>{t(`contentItems.${key}.title`)}</h3>
                <p>{t(`contentItems.${key}.content`)}</p>
              </div>
            );
          })}
        </div>
      }
    />
  );
}
