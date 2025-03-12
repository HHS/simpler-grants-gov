import { UswdsIconNames } from "src/types/generalTypes";

import { useTranslations } from "next-intl";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";
import { USWDSIcon } from "src/components/USWDSIcon";

type RoadmapProcessSectionContentProps = {
  content: string;
  title: string;
  iconName: UswdsIconNames;
};

type RoadmapProcessGrid = RoadmapProcessSectionContentProps[][];

export default function RoadmapProcess() {
  const t = useTranslations("Roadmap.sections.process");
  const roadmapProcesSectionGridRows: RoadmapProcessGrid = [
    [
      {
        title: t(`contentItems.${0}.title`),
        content: t(`contentItems.${0}.content`),
        iconName: "visibility",
      },
      {
        title: t(`contentItems.${1}.title`),
        content: t(`contentItems.${1}.content`),
        iconName: "insights",
      },
    ],
    [
      {
        title: t(`contentItems.${2}.title`),
        content: t(`contentItems.${2}.content`),
        iconName: "construction",
      },
    ],
  ];

  return (
    <div className={"bg-white"}>
      <RoadmapPageSection title={t("title")}>
        <p className="margin-0 tablet-lg:margin-bottom-2 line-height-sans-4 tablet:font-sans-md">
          {t("sectionSummary")}
        </p>
        {roadmapProcesSectionGridRows.map((sectionRow, sectionRoadIdx) => (
          <div
            className="grid-row"
            key={`roadmap-process-row-${sectionRoadIdx}`}
          >
            {sectionRow.map((sectionRowItem) => (
              <div
                className="grid-col-12 tablet-lg:grid-col-6 tablet-lg:padding-right-5"
                key={`roadmap-process-${sectionRowItem.title}`}
              >
                <RoadmapProcessSectionContent {...sectionRowItem} />
              </div>
            ))}
          </div>
        ))}
      </RoadmapPageSection>
    </div>
  );
}

const RoadmapProcessSectionContent = ({
  title,
  content,
  iconName,
}: RoadmapProcessSectionContentProps) => {
  return (
    <div className="margin-top-2">
      {iconName && <USWDSIcon className="usa-icon" name={iconName} />}
      <h3 className="font-sans-sm margin-0 margin-top-1 tablet:font-sans-md">
        {title}
      </h3>
      <p className="font-sans-xs margin-top-1 margin-bottom-0 line-height-sans-4">
        {content}
      </p>
    </div>
  );
};
