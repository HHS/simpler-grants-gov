import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import {
  OpportunityHistoryItem,
  useFormatHistoryDate,
} from "./OpportunityHistoryItem";

type Props = {
  detail: OpportunityDetail;
};

export const PostedOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  const formatHistoryDate = useFormatHistoryDate();

  const { close_date, close_date_description } = detail.summary;

  const content = close_date
    ? formatHistoryDate(close_date)
    : (close_date_description || formatHistoryDate(null));

  return (
    <div className="padding-05">
      <ul className="usa-list usa-list--unstyled">
        <OpportunityHistoryItem
          title={t("closing")}
          content={content}
          description={close_date ? close_date_description : null}
        />
      </ul>
    </div>
  );
};
