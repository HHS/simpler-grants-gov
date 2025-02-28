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
          <p className="margin-top-0">{t("sectionSummary")}</p>
          {Object.keys(contentItems).map((key) => {
            return (
              <div className="margin-bottom-2" key={`roadmap-process-${key}`}>
                <h3 className="margin-bottom-1">
                  {t(`contentItems.${key}.title`)}
                </h3>
                <p className="margin-0">{t(`contentItems.${key}.content`)}</p>
              </div>
            );
          })}
        </div>
      }
    />
  );
}
