import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  detail: OpportunityDetail;
};

const formatHistoryDate = (date: string | null, fallback = "--") => {
  return date === null ? fallback : formatDate(date);
};

export const ArchivedOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div>
      <div className="padding-05">
        <OpportunityHistoryItem
          title={t("archived")}
          content={formatHistoryDate(detail.summary.archive_date)}
        />
        <OpportunityHistoryItem
          title={t("closed")}
          content={formatHistoryDate(
            detail.summary.close_date,
            t("notSpecified"),
          )}
        />
      </div>
    </div>
  );
};
