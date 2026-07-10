import { AwardRecommendationStatus } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import { CSSProperties } from "react";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type Props = {
  status: AwardRecommendationStatus;
};

const STATUS_TAG_CLASSNAME =
  "usa-tag radius-2 font-sans-sm text-no-uppercase display-inline-flex flex-align-center flex-shrink-0";
const STATUS_TAG_STYLE: CSSProperties = { whiteSpace: "nowrap" };

const AwardRecommendationStatusTag = ({ status }: Props) => {
  const t = useTranslations("AwardRecommendation.statusTag");

  const statusTag = () => {
    switch (status) {
      case "draft":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-accent-warm-light text-ink`}
            data-testid="award-recommendation-status-in-progress"
            style={STATUS_TAG_STYLE}
          >
            <USWDSIcon name="schedule" className="margin-right-05" />
            {t("draft")}
          </div>
        );
      case "in_review":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-error-dark text-white`}
            data-testid="award-recommendation-status-pending-review"
            style={STATUS_TAG_STYLE}
          >
            <USWDSIcon name="visibility" className="margin-right-05" />
            {t("in_review")}
          </div>
        );
      case "approved":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-info-dark text-white`}
            data-testid="award-recommendation-status-approved"
            style={STATUS_TAG_STYLE}
          >
            <USWDSIcon name="check" className="margin-right-05" />
            {t("approved")}
          </div>
        );
      default:
        return null;
    }
  };

  return <div data-testid="award-recommendation-status-tag">{statusTag()}</div>;
};

export default AwardRecommendationStatusTag;
