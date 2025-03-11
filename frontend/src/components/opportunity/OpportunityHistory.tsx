import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

type Props = {
  summary: Summary;
};

const formatHistoryDate = (date: string | null) => {
  return date === null ? "--" : formatDate(date);
};

const OpportunityHistoryItem = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  return (
    <div>
      <p className={"text-bold"}>
        {title}
        {":"}
      </p>
      <p className={"margin-top-0"}>{content}</p>
    </div>
  );
};

const OpportunityHistory = ({ summary }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  const ForeCastItems = () => {
    if(summary.is_forecast) {
      return (
        <>
        <OpportunityHistoryItem
          title={t("forcasted_award_date")}
          content={formatHistoryDate(summary.forecasted_award_date)}
        />
        <OpportunityHistoryItem
          title={t("forcasted_post_date")}
          content={formatHistoryDate(summary.forecasted_post_date)}
        />
        <OpportunityHistoryItem
          title={t("forcasted_close_date")}
          content={formatHistoryDate(summary.forecasted_close_date)}
        />
        <OpportunityHistoryItem
          title={t("forcasted_close_date_description")}
          content={summary.forecasted_close_date_description ? summary.forecasted_close_date_description : ""}
        />
        </>
      );
    }
    return <></>
  }

  return (
    <div className="usa-prose margin-top-4">
      <h3>{t("history")}</h3>
      <OpportunityHistoryItem
        title={t("version")}
        content={
          summary.version_number ? summary.version_number.toString() : "--"
        }
      />
      <OpportunityHistoryItem
        title={t("posted_date")}
        content={formatHistoryDate(summary.post_date)}
      />
      <OpportunityHistoryItem
        title={t("archive_date")}
        content={formatHistoryDate(summary.archive_date)}
      />
      <ForeCastItems />

    </div>
  );
};

export default OpportunityHistory;
