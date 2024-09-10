import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

type Props = {
  opportunityData: Opportunity;
};

const formatHistorySubContent = (content: string | null, title: string) => {
  if (title.toLowerCase().includes("date")) {
    formatDate(content);
  }
  return content === null ? "--" : content;
};

const OpportunityHistory = ({ opportunityData }: Props) => {
  const versionInfo = {
    Version: "--",
    "Posted date": opportunityData.summary.post_date,
    "Original closing date for applications":
      opportunityData.summary.close_date,
    "Archive date": opportunityData.summary.archive_date,
  };
  return (
    <div className="usa-prose margin-top-4">
      <h3>History</h3>
      {Object.entries(versionInfo).map(([title, content]) => (
        <>
          <p className={"text-bold"}>
            {title}
            {":"}
          </p>
          <p className={"margin-top-0"}>
            {formatHistorySubContent(content, title)}
          </p>
        </>
      ))}
    </div>
  );
};

export default OpportunityHistory;
