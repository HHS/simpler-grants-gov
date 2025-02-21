import clsx from "clsx";
import { formatDate } from "src/utils/dateUtil";

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
}: StatusItemProps) => {
  return (
    <span
      className="
        tablet:padding-x-1
        tablet:margin-left-neg-1
        tablet:margin-right-1
        tablet:border-base-lighter"
    >
      <span
        className={clsx("display-flex", {
          "usa-tag margin-right-2 tablet:margin-0": tag,
          "bg-accent-warm-dark": orange,
        })}
      >
        <strong>{description}</strong>
        {showDate && (
          <span className="text-no-uppercase">
            {date ? formatDate(date) : "--"}
          </span>
        )}
      </span>
    </span>
  );
};

interface SearchResultListItemStatusProps {
  status: string | null;
  archivedString: string;
  closedString: string;
  forecastedString: string;
  postedString: string;
  archiveDate: string | null;
  closedDate: string | null;
}

const SearchResultListItemStatus = ({
  status,
  archiveDate,
  closedDate,
  archivedString,
  closedString,
  forecastedString,
  postedString,
}: SearchResultListItemStatusProps) => {
  return (
    <>
      {status === "archived" && (
        <StatusItem date={archiveDate} description={archivedString} />
      )}
      {(status === "archived" || status === "closed") && closedDate && (
        <StatusItem description={closedString} date={closedDate} />
      )}
      {status === "posted" && (
        <StatusItem
          description={postedString}
          date={closedDate}
          orange={true}
          tag={true}
        />
      )}
      {status === "forecasted" && (
        <StatusItem
          description={forecastedString}
          showDate={false}
          tag={true}
        />
      )}
    </>
  );
};

export default SearchResultListItemStatus;
