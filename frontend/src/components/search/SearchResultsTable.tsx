import clsx from "clsx";
import { isNil } from "lodash";
import {
  BaseOpportunity,
  MinimalOpportunity,
  OpportunityStatus,
  PossiblySavedBaseOpportunity,
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
import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";
import { FilterSearchNoResults } from "./Filters/FilterSearchNoResults";

const statusColorClasses = {
  posted: "bg-accent-warm-light",
  forecasted: "bg-accent-warm-lightest",
  closed: "bg-base-lightest",
  archived: "bg-base-lightest",
};

const indicateWhichSearchResultsAreSaved = (
  searchResults: SearchResponseData,
  savedOpportunities: MinimalOpportunity[],
) => {
  const savedIds = savedOpportunities.map(
    ({ opportunity_id }) => opportunity_id,
  );
  return searchResults.map((result) =>
    savedIds.includes(result.opportunity_id)
      ? { ...result, opportunitySaved: true }
      : result,
  );
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
  page,
  index,
}: {
  opportunity: PossiblySavedBaseOpportunity;
  page: number;
  index: number;
}) => {
  const t = useTranslations("Search.table");
  return (
    <>
      <div className="display-flex">
        <div className="margin-y-auto grid-col-auto minw-4">
          <OpportunitySaveUserControl
            opportunityId={opportunity.opportunity_id}
            type="icon"
            opportunitySaved={opportunity.opportunitySaved || false}
          />
        </div>
        <div className="grid-col-fill">
          <div className="font-sans-md text-bold line-height-sans-3">
            <a
              href={getOpportunityUrl(opportunity.opportunity_id)}
              id={`search-result-link-${page}-${index + 1}`}
            >
              {opportunity.opportunity_title}
            </a>
          </div>
          <div className="display-none tablet-lg:display-block font-sans-xs">
            <span className="text-bold">{t("number")}:</span>{" "}
            {opportunity.opportunity_number}
          </div>
        </div>
      </div>
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
  result: PossiblySavedBaseOpportunity,
  page: number,
  index: number,
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
      cellData: <TitleDisplay opportunity={result} page={page} index={index} />,
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

export const SearchResultsTable = ({
  searchResults,
  page,
  savedOpportunities,
}: {
  searchResults: SearchResponseData;
  page: number;
  savedOpportunities: MinimalOpportunity[];
}) => {
  const t = useTranslations("Search.table");

  if (!searchResults.length) {
    return <FilterSearchNoResults useHeading={true} />;
  }

  const searchResultsWithSavedOpportunities =
    indicateWhichSearchResultsAreSaved(searchResults, savedOpportunities);

  const headerContent: TableCellData[] = [
    { cellData: t("headings.closeDate") },
    { cellData: t("headings.status") },
    { cellData: t("headings.title") },
    { cellData: t("headings.agency") },
    { cellData: t("headings.awardMin") },
    { cellData: t("headings.awardMax") },
  ];
  const tableRowData = searchResultsWithSavedOpportunities.map(
    (result, index) => toSearchResultsTableRow(result, page, index),
  );
  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
};
