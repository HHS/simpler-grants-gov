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
  const hasDescriptionOnly = !close_date && !!close_date_description;

  return (
    <div className="padding-05">
      <ul className="usa-list usa-list--unstyled">
        {hasDescriptionOnly ? (
          <li className="margin-y-1">
            <p className="margin-bottom-0">{close_date_description}</p>
          </li>
        ) : (
          <OpportunityHistoryItem
            title={t("closing")}
            content={formatHistoryDate(close_date)}
            description={close_date ? close_date_description : null}
          />
        )}
      </ul>
    </div>
  );
};
