import clsx from "clsx";
import { isNil } from "lodash";
import { fetchSavedOpportunities } from "src/services/fetch/fetchers/savedOpportunityFetcher";
import {
  BaseOpportunity,
  OpportunityStatus,
} from "src/types/opportunity/opportunityResponseTypes";
import { SearchResponseData } from "src/types/search/searchRequestTypes";
import { toShortMonthDate } from "src/utils/dateUtil";
import { formatCurrency } from "src/utils/formatCurrencyUtil";
import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";
import { USWDSIcon } from "src/components/USWDSIcon";
import { FilterSearchNoResults } from "./Filters/FilterSearchNoResults";

const statusColorClasses = {
  posted: "bg-accent-warm-light",
  forecasted: "bg-accent-warm-lightest",
  closed: "bg-base-lightest",
  archived: "bg-base-lightest",
};

const SearchTableStatusDisplay = ({
  status,
}: {
  status: OpportunityStatus;
}) => {
  const t = useTranslations("Search.table");
  const backgroundClass = statusColorClasses[status];
  return (
    <div
      className={clsx("text-center padding-y-05 minw-15 radius-md", {
        [backgroundClass]: !!backgroundClass,
      })}
    >
      {t(`statuses.${status}`)}
    </div>
  );
};

const CloseDateDisplay = ({ closeDate }: { closeDate: string }) => {
  const t = useTranslations("Search.table");
  return <>{closeDate ? toShortMonthDate(closeDate) : t("tbd")}</>;
};

const TitleDisplay = ({
  opportunity,
  saved,
}: {
  opportunity: BaseOpportunity;
  saved: boolean;
}) => {
  const t = useTranslations("Search.table");
  return (
    <>
      <div className="font-sans-lg text-bold">
        <a href={getOpportunityUrl(opportunity.opportunity_id)}>
          {opportunity.opportunity_title}
        </a>
      </div>
      <div className="display-none tablet-lg:display-block font-sans-xs">
        <span className="text-bold">{t("number")}:</span>{" "}
        {opportunity.opportunity_number}
      </div>
      {saved && (
        <div className="margin-top-2 display-inline-block">
          <span className="display-flex flex-align-center font-sans-2xs">
            <USWDSIcon
              name="star"
              className="text-accent-warm-dark button-icon-md padding-right-05"
            />
            {t("saved")}
          </span>
        </div>
      )}
    </>
  );
};

const AgencyDisplay = ({ opportunity }: { opportunity: BaseOpportunity }) => {
  const t = useTranslations("Search.table");
  return (
    <>
      <div className="tablet-lg:margin-bottom-1">{opportunity.agency_name}</div>
      <div className="font-sans-xs display-none tablet-lg:display-block">
        <span className="text-bold">{t("published")}</span>:{" "}
        {toShortMonthDate(opportunity.summary.post_date || "")}
      </div>
      <div className="font-sans-xs display-none tablet-lg:display-block">
        {t("expectedAwards")}:{" "}
        {isNil(opportunity.summary.expected_number_of_awards)
          ? "--"
          : opportunity.summary.expected_number_of_awards}
      </div>
    </>
  );
};

const toSearchResultsTableRow = (
  result: BaseOpportunity,
  saved: boolean,
): TableCellData[] => {
  return [
    {
      cellData: (
        <CloseDateDisplay closeDate={result.summary.close_date || ""} />
      ),
      stackOrder: 2,
    },
    {
      cellData: <SearchTableStatusDisplay status={result.opportunity_status} />,
      stackOrder: 1,
    },
    {
      cellData: <TitleDisplay opportunity={result} saved={saved} />,
      stackOrder: 0,
    },
    {
      cellData: <AgencyDisplay opportunity={result} />,
      stackOrder: 3,
    },
    {
      cellData: isNil(result.summary.award_floor)
        ? "$--"
        : formatCurrency(result.summary.award_floor),
      stackOrder: 4,
    },
    {
      cellData: isNil(result.summary.award_ceiling)
        ? "$--"
        : formatCurrency(result.summary.award_ceiling),
      stackOrder: 5,
    },
  ];
};

export const SearchResultsTable = async ({
  searchResults,
}: {
  searchResults: SearchResponseData;
}) => {
  const t = useTranslations("Search.table");

  if (!searchResults.length) {
    return <FilterSearchNoResults useHeading={true} />;
  }

  const savedOpportunities = await fetchSavedOpportunities();
  const savedOpportunityIds = savedOpportunities.map(
    (opportunity) => opportunity.opportunity_id,
  );

  const headerContent: TableCellData[] = [
    { cellData: t("headings.closeDate") },
    { cellData: t("headings.status") },
    { cellData: t("headings.title") },
    { cellData: t("headings.agency") },
    { cellData: t("headings.awardMin") },
    { cellData: t("headings.awardMax") },
  ];
  const tableRowData = searchResults.map((result) =>
    toSearchResultsTableRow(
      result,
      savedOpportunityIds.includes(result.opportunity_id),
    ),
  );
  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
};
