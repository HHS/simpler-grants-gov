import { useMessages, useTranslations } from "next-intl";

import RoadmapPageSection from "src/components/roadmap/RoadmapPageSection";

export default function RoadmapTimeline() {
  const t = useTranslations("Roadmap.sections.timeline");
  const messages = useMessages() as unknown as IntlMessages;
  const { contentItems = {} } = messages.Roadmap.sections.timeline;

  return (
    <RoadmapPageSection title={t("title")}>
      {contentItems &&
        Object.keys(contentItems).map((key) => {
          const title = t(`contentItems.${key}.title`);
          return (
            <div
              className="roadmap-row grid-row"
              key={`roadmap-timeline-${title}-key`}
            >
              <div className="padding-y-2 padding-left-3 border-base-darkest border-left-2px tablet:border-left-0 tablet:grid-col-4 tablet:padding-right-4 tablet:padding-left-0">
                <h3 className="position-relative tablet:text-right">
                  {t(`contentItems.${key}.date`)}
                </h3>
              </div>
              <div className="padding-y-2 padding-left-3 border-base-darkest border-left-2px tablet:grid-col-8 tablet:padding-left-4">
                <h4>{t(`contentItems.${key}.title`)}</h4>
                {t.rich(`contentItems.${key}.content`, {
                  p: (content) => <p>{content}</p>,
                  "link-search": (content) => (
                    <a href="https://simpler.grants.gov/search">{content}</a>
                  ),
                  "link-form": (content) => (
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSeM3PjjAKv4g_PFKTyf9OArsSJU4sYx2mnjxn_npSNaq5qTlA/viewform"
                      target="_blank"
                    >
                      {content}
                    </a>
                  ),
                })}
              </div>
            </div>
          );
        })}
    </RoadmapPageSection>
  );
}
