import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  detail: OpportunityDetail;
};

export const PostedOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  const formatHistoryDate = (date: string | null) =>
    date ? formatDate(date) : t("notSpecified");

  return (
    <div className="padding-05">
      <ul className="usa-list usa-list--unstyled">
        <OpportunityHistoryItem
          title={t("closing")}
          content={formatHistoryDate(detail.summary.close_date)}
          description={detail.summary.close_date_description}
        />
      </ul>
    </div>
  );
};
