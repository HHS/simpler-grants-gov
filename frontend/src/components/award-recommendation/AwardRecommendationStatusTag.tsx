import { AwardRecommendationStatus } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/USWDSIcon";

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
      case "in_review":
        return (
          <div
            className="usa-tag bg-error-dark text-white radius-2 font-sans-sm text-no-uppercase display-flex flex-align-center"
            data-testid="award-recommendation-status-in-review"
          >
            <USWDSIcon name="visibility" className="margin-right-05" />
            {t("in_review")}
          </div>
        );
      case "approved":
        return (
          <div
            className="usa-tag bg-info-dark text-white radius-2 font-sans-sm text-no-uppercase display-flex flex-align-center"
            data-testid="award-recommendation-status-approved"
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
