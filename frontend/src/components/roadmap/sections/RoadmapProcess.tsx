import { UswdsIconNames } from "src/types/generalTypes";

import { useTranslations } from "next-intl";

import IconInfo from "src/components/homepage/IconInfoSection";
import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

type RoadmapProcessSectionContentProps = {
  content: string;
  title: string;
  iconName: UswdsIconNames;
  link?: string;
  linkText?: string;
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
        link: t(`contentItems.${2}.link`),
        linkText: t(`contentItems.${2}.linkText`),
      },
      {
        title: t(`contentItems.${3}.title`),
        content: t(`contentItems.${3}.content`),
        iconName: "star_half",
        link: t(`contentItems.${3}.link`),
        linkText: t(`contentItems.${3}.linkText`),
      },
    ],
  ];

  return (
    <RoadmapPageSection className="bg-base-lightest" title={t("title")}>
      <p>{t("sectionSummary")}</p>
      {roadmapProcesSectionGridRows.map((sectionRow, sectionRoadIdx) => (
        <div
          className="grid-row grid-gap"
          key={`roadmap-process-row-${sectionRoadIdx}`}
        >
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
  link,
  linkText,
}: RoadmapProcessSectionContentProps) => {
  return (
    <div className="margin-top-4">
      <IconInfo
        title={title}
        description={content}
        iconName={iconName}
        link={link}
        linkText={linkText}
      />
    </div>
  );
};
