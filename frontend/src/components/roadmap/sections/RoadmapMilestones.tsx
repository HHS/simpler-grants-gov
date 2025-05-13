"use client";

import { useMessages, useTranslations } from "next-intl";
import { useState } from "react";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapMilestones() {
  const t = useTranslations("Roadmap.sections.milestones");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems, contentItems2 } = messages.Roadmap.sections.milestones;

  // State to track if Late 2024 accordion is open (default to closed)
  const [isLate2024Open, setIsLate2024Open] = useState(false);

  const toggleLate2024 = () => {
    setIsLate2024Open(!isLate2024Open);
  };

  return (
    <RoadmapPageSection className="bg-base-lightest" title={t("title")}>
      {/* Early 2025 Section - Always visible */}
      <h2 className="font-sans-md margin-0 margin-top-1 tablet:font-sans-lg">
        {t("contentTitle")}
      </h2>

      {/* Render Early 2025 content items */}
      {Object.keys(contentItems).map((key) => {
        const title = t(`contentItems.${key}.title`);
        return (
          <div key={`roadmap-milestones-${title}-key`}>
            <h3 className="font-sans-sm margin-top-3 margin-bottom-1 tablet:font-sans-md">
              {title}
            </h3>
            <p className="font-sans-xs margin-0 margin-bottom-0 line-height-sans-4">
              {t(`contentItems.${key}.content`)}
            </p>
          </div>
        );
      })}

      {/* Late 2024 Section with Accordion */}
      <div className="accordion-item margin-top-5">
        <h2
          className="font-sans-md margin-0 tablet:font-sans-lg cursor-pointer"
          onClick={toggleLate2024}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {t("contentTitle2")}
          <span className="margin-left-1">{isLate2024Open ? "−" : "+"}</span>
        </h2>

        {/* Accordion content - only visible when open */}
        {isLate2024Open && (
          <div className="margin-top-2">
            {Object.keys(contentItems2).map((key) => {
              const title = t(`contentItems2.${key}.title`);
              return (
                <div key={`roadmap-milestones-late2024-${key}`}>
                  <h3 className="font-sans-sm margin-top-3 margin-bottom-1 tablet:font-sans-md">
                    {title}
                  </h3>
                  <p className="font-sans-xs margin-0 margin-bottom-0 line-height-sans-4">
                    {t(`contentItems2.${key}.content`)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoadmapPageSection>
  );
}
