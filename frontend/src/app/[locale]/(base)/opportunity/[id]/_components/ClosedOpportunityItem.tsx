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

export const ClosedOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div>
      <div className="padding-05">
        <OpportunityHistoryItem
          title={t("closed")}
          content={formatHistoryDate(detail.summary.close_date)}
        />
      </div>
    </div>
  );
};
