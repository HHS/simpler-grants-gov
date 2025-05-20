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
      {
        title: t(`contentItems.${2}.title`),
        content: t(`contentItems.${2}.content`),
        iconName: "construction",
      },
    ],
  ];

  return (
    <RoadmapPageSection className={"bg-white"} title={t("title")}>
      <p>
        {t("sectionSummary")}
      </p>
      {roadmapProcesSectionGridRows.map((sectionRow, sectionRoadIdx) => (
        <div className="grid-row grid-gap" key={`roadmap-process-row-${sectionRoadIdx}`}>
          {sectionRow.map((sectionRowItem) => (
            <div
              className="tablet:grid-col-6"
              key={`roadmap-process-${sectionRowItem.title}`}
            >
              <RoadmapProcessSectionContent {...sectionRowItem} />
            </div>
          ))}
        </div>
      ))}
    </RoadmapPageSection>
  );
}

const RoadmapProcessSectionContent = ({
  title,
  content,
  iconName,
}: RoadmapProcessSectionContentProps) => {
  return (
    <div className="margin-top-4">
      {iconName && <USWDSIcon className="usa-icon--size-4 text-middle" name={iconName} />}
      <h3 className="margin-top-2">
        {title}
      </h3>
      <p>
        {content}
      </p>
    </div>
  );
};
