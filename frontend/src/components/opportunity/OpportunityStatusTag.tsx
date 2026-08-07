import { OpportunityStatus } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { CSSProperties } from "react";

import { USWDSIcon } from "src/components/core/USWDSIcon";

/**
 * Displays status badges for opportunities
 * 
 * Status badge styling:
 * - Draft: Light yellow background (bg-accent-warm-lighter) with warning icon
 * - Open/Posted: Light mint green background (bg-mint-cool-5), no icon
 * - Forecasted: Light yellow background (bg-accent-warm-lighter), no icon
 * - Closed: Very light gray background (bg-base-lightest), no icon
 * - Archived: Very light gray background (bg-base-lightest), no icon
 */
type Props = {
  status: OpportunityStatus | "draft";
};

const STATUS_TAG_CLASSNAME =
  "usa-tag radius-2 font-sans-sm text-no-uppercase display-inline-flex flex-align-center flex-shrink-0";
const STATUS_TAG_STYLE: CSSProperties = { whiteSpace: "nowrap" };

const OpportunityStatusTag = ({ status }: Props) => {
  const t = useTranslations("Opportunities.statusTag");

  const statusTag = () => {
    switch (status) {
      case "draft":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-accent-warm-lighter text-ink`}
            data-testid="opportunity-status-draft"
            style={STATUS_TAG_STYLE}
          >
            <USWDSIcon name="warning" className="margin-right-05" />
            {t("draft")}
          </div>
        );
      case "posted":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-mint-lighter-custom text-ink`}
            data-testid="opportunity-status-posted"
            style={STATUS_TAG_STYLE}
          >
            {t("posted")}
          </div>
        );
      case "forecasted":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-accent-warm-lighter text-ink`}
            data-testid="opportunity-status-forecasted"
            style={STATUS_TAG_STYLE}
          >
            {t("forecasted")}
          </div>
        );
      case "archived":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-base-lightest text-ink`}
            data-testid="opportunity-status-archived"
            style={STATUS_TAG_STYLE}
          >
            {t("archived")}
          </div>
        );
      case "closed":
        return (
          <div
            className={`${STATUS_TAG_CLASSNAME} bg-base-lightest text-ink`}
            data-testid="opportunity-status-closed"
            style={STATUS_TAG_STYLE}
          >
            {t("closed")}
          </div>
        );
      default:
        return null;
    }
  };

  return <div data-testid="opportunity-status-tag">{statusTag()}</div>;
};

export default OpportunityStatusTag;
