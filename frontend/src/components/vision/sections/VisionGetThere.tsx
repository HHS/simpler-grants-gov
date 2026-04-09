import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";

import VisionPageSection from "src/components/vision/visionPageSection";

export default function VisionGetThere() {
  const t = useTranslations("Vision.sections.getThere");

  return (
    <VisionPageSection className="bg-white" title={t("title")}>
      <h3>{t("contentTitle")}</h3>
      <div>
        <p>{t("paragraph1")}</p>
        <p>{t("paragraph2")}</p>
        <p>
          <a
            href={ExternalRoutes.WIKI_USER_RESEARCH_ARCHETYPES}
            target="_blank"
            rel="noopener noreferrer"
            className="usa-link--external"
          >
            {t("linkText1")}
          </a>
        </p>
        <p>
          <a
            href={ExternalRoutes.ETHNIO_VOLUNTEER}
            target="_blank"
            rel="noopener noreferrer"
            className="usa-link--external"
          >
            {t("linkText2")}
          </a>
        </p>
        <p>
          <a
            href={ExternalRoutes.FIDER}
            target="_blank"
            rel="noopener noreferrer"
            className="usa-link--external"
          >
            {t("linkText3")}
          </a>
        </p>
      </div>
    </VisionPageSection>
  );
}
