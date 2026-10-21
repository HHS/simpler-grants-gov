import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  detail: OpportunityDetail;
};

const formatHistoryDate = (date: string | null) => {
  return date === null ? "--" : formatDate(date);
};

export const PostedOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div>
      <div className="padding-05">
        <OpportunityHistoryItem
          title={t("closing")}
          content={formatHistoryDate(detail.summary.close_date)}
        />
        <OpportunityHistoryItem
          title={t("closeDateDescription")}
          content={
            detail.summary.close_date_description
              ? detail.summary.close_date_description
              : t("closeDateDescriptionNotAvailable")
          }
        />
      </div>
    </div>
  );
};
