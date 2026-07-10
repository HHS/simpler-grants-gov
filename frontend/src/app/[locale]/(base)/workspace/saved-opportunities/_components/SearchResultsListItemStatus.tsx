import clsx from "clsx";
import { formatDate } from "src/utils/dateUtil";

import { ReactElement } from "react";

interface StatusItemProps {
  description: string;
  showDate?: boolean;
  date?: string | null;
  tag?: boolean;
  orange?: boolean;
}

const StatusItem = ({
  description,
  date = null,
  orange = false,
  showDate = true,
  tag = false,
}: StatusItemProps): ReactElement => {
  return (
    <div
      className={clsx("search-result-status__item", {
        "usa-tag search-result-status__item--tag": tag,
        "bg-accent-warm-dark": orange,
      })}
    >
      <dt className="search-result-status__term">{description}</dt>
      {showDate ? (
        <dd className="search-result-status__description">
          {date ? formatDate(date) : "--"}
        </dd>
      ) : null}
    </div>
  );
};

export interface SearchResultsListItemStatusProps {
  status: string | null;
  archivedString: string;
  closedString: string;
  forecastedString: string;
  postedString: string;
  archiveDate: string | null;
  closedDate: string | null;
}

const SearchResultsListItemStatus = ({
  status,
  archiveDate,
  closedDate,
  archivedString,
  closedString,
  forecastedString,
  postedString,
}: SearchResultsListItemStatusProps): ReactElement => {
  return (
    <>
      {status === "archived" ? (
        <StatusItem date={archiveDate} description={archivedString} />
      ) : null}
      {(status === "archived" || status === "closed") && closedDate ? (
        <StatusItem description={closedString} date={closedDate} />
      ) : null}
      {status === "posted" ? (
        <StatusItem
          description={postedString}
          date={closedDate}
          orange={true}
          tag={true}
        />
      ) : null}
      {status === "forecasted" ? (
        <StatusItem
          description={forecastedString}
          showDate={false}
          tag={true}
        />
      ) : null}
    </>
  );
};

export default SearchResultsListItemStatus;
