import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/USWDSIcon";

export type AwardRecommendationStatus =
  | "draft"
  | "in_progress"
  | "pending_review";

type Props = {
  status: AwardRecommendationStatus;
};

const AwardRecommendationStatusTag = ({ status }: Props) => {
  const t = useTranslations("AwardRecommendation.statusTag");

  const statusTag = () => {
    switch (status) {
      case "draft":
        return (
          <div
            className="usa-tag bg-base-dark text-white radius-2 border-base-lightest font-sans-sm text-no-uppercase display-flex flex-align-center"
            data-testid="award-recommendation-status-draft"
          >
            <USWDSIcon name="edit" className="margin-right-05" />
            {t("draft")}
          </div>
        );
      case "in_progress":
        return (
          <div
            className="usa-tag bg-accent-warm-light text-ink radius-2 font-sans-sm text-no-uppercase display-flex flex-align-center"
            data-testid="award-recommendation-status-in-progress"
          >
            <USWDSIcon name="schedule" className="margin-right-05" />
            {t("inProgress")}
          </div>
        );
      case "pending_review":
        return (
          <div
            className="usa-tag bg-error-dark text-white radius-2 font-sans-sm text-no-uppercase display-flex flex-align-center"
            data-testid="award-recommendation-status-pending-review"
          >
            <USWDSIcon name="visibility" className="margin-right-05" />
            {t("pendingReview")}
          </div>
        );
      default:
        return null;
    }
  };

  return <div data-testid="award-recommendation-status-tag">{statusTag()}</div>;
};

export default AwardRecommendationStatusTag;
