import clsx from "clsx";
import { isNil } from "lodash";
import { OpportunityStatus } from "src/types/opportunity/opportunityResponseTypes";
import { SearchResponseData } from "src/types/search/searchRequestTypes";
import { toShortMonthDate } from "src/utils/dateUtil";
import { formatCurrency } from "src/utils/formatCurrencyUtil";
import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { Table } from "@trussworks/react-uswds";

const statusColorClasses = {
  posted: "bg-accent-warm-light",
  forecasted: "bg-accent-warm-lightest",
  closed: "bg-base-lightest",
  archived: "bg-base-lightest",
};

export const SearchTableStatusDisplay = ({
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

type TableCellData = {
  cellData: ReactNode;
  hideWhenStacked?: boolean;
  className?: string;
};

const TableWithResponsiveHeader = ({
  headerContent,
  tableRowData,
}: {
  headerContent: TableCellData[];
  tableRowData: TableCellData[][];
}) => {
  if (
    !tableRowData.every((tableRow) => tableRow.length === headerContent.length)
  ) {
    console.error(
      "Header and data content have mismatched link, unable to display responsive table",
    );
    return;
  }
  return (
    <Table className="simpler-responsive-table">
      <thead>
        <tr>
          {headerContent.map((headerItem, i) => {
            return (
              <th
                key={`responsiveHeaderItem-${i}`}
                scope="col"
                className={clsx(
                  "bg-base-lightest padding-y-205 minw-15",
                  headerItem.className,
                )}
              >
                {headerItem.cellData}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {tableRowData.map((tableRow, i) => {
          return (
            <tr key={`responsiveTableRow-${i}`}>
              {tableRow.map((tableCell, j) => {
                return (
                  <td
                    key={`responsiveTableCell-${i}-${j}`}
                    className={clsx(
                      "tablet-lg:display-table-cell",
                      tableCell.className,
                      {
                        "display-none": tableCell.hideWhenStacked,
                        "display-block": !tableCell.hideWhenStacked,
                      },
                    )}
                  >
                    {tableCell.cellData}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export const SearchResultsTable = ({
  searchResults,
}: {
  searchResults: SearchResponseData;
}) => {
  const t = useTranslations("Search.table");
  const headerContent = [
    { cellData: t("headings.closeDate") },
    { cellData: t("headings.status") },
    { cellData: t("headings.title") },
    { cellData: t("headings.agency") },
    { cellData: t("headings.awardMin") },
    { cellData: t("headings.awardMax") },
  ];
  const tableRowData = searchResults.map((result) => {
    return [
      {
        cellData: result.summary.close_date
          ? toShortMonthDate(result.summary.close_date)
          : t("tbd"),
      },
      {
        cellData: (
          <SearchTableStatusDisplay status={result.opportunity_status} />
        ),
      },
      {
        cellData: (
          <>
            <div className="font-sans-lg text-bold">
              <a href={getOpportunityUrl(result.opportunity_id)}>
                {result.opportunity_title}
              </a>
            </div>
            <div className="font-sans-xs">
              <span className="text-bold">{t("number")}:</span>{" "}
              {result.opportunity_number}
            </div>
          </>
        ),
      },
      {
        cellData: (
          <>
            <div className="margin-bottom-1">{result.agency_name}</div>
            <div className="font-sans-xs">
              <span className="text-bold">{t("published")}</span>:{" "}
              {result.summary.post_date}
            </div>
            <div className="font-sans-xs">
              {t("expectedAwards")}:{" "}
              {isNil(result.summary.expected_number_of_awards)
                ? "--"
                : result.summary.expected_number_of_awards}
            </div>
          </>
        ),
      },
      {
        cellData: isNil(result.summary.award_floor)
          ? "$--"
          : formatCurrency(result.summary.award_floor),
      },
      {
        cellData: isNil(result.summary.award_ceiling)
          ? "$--"
          : formatCurrency(result.summary.award_ceiling),
      },
    ];
  });
  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
};

// export const SearchResultsTable = ({
//   searchResults,
// }: {
//   searchResults: SearchResponseData;
// }) => {
//   const t = useTranslations("Search.table");
//   return (
//     <Table>
//       <thead>
//         <tr>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-block tablet:display-table-cell"
//           >
//             {t("headings.closeDate")}
//           </th>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-block tablet:display-table-cell"
//           >
//             {t("headings.status")}
//           </th>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-block tablet:display-table-cell"
//           >
//             {t("headings.title")}
//           </th>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-none tablet:display-table-cell"
//           >
//             {t("headings.agency")}
//           </th>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-block tablet:display-table-cell"
//           >
//             {t("headings.awardMin")}
//           </th>
//           <th
//             scope="col"
//             className="bg-base-lightest padding-y-205 minw-15 display-block tablet:display-table-cell"
//           >
//             {t("headings.awardMax")}
//           </th>
//         </tr>
//       </thead>
//       <tbody>
//         {searchResults.map((result) => {
//           return (
//             <tr key={result.opportunity_id}>
//               <td className="display-block tablet:display-table-cell">
//                 {result.summary.close_date
//                   ? toShortMonthDate(result.summary.close_date)
//                   : t("tbd")}
//               </td>
//               <td className="display-block tablet:display-table-cell">
//                 <SearchTableStatusDisplay status={result.opportunity_status} />
//               </td>
//               <td className="display-block tablet:display-table-cell">
//                 <div className="font-sans-lg text-bold">
//                   <a href={getOpportunityUrl(result.opportunity_id)}>
//                     {result.opportunity_title}
//                   </a>
//                 </div>
//                 <div className="font-sans-xs">
//                   <span className="text-bold">{t("number")}:</span>{" "}
//                   {result.opportunity_number}
//                 </div>
//               </td>
//               <td className="display-none tablet:display-table-cell">
//                 <div className="margin-bottom-1">{result.agency_name}</div>
//                 <div className="font-sans-xs">
//                   <span className="text-bold">{t("published")}</span>:{" "}
//                   {result.summary.post_date}
//                 </div>
//                 <div className="font-sans-xs">
//                   {t("expectedAwards")}:{" "}
//                   {isNil(result.summary.expected_number_of_awards)
//                     ? "--"
//                     : result.summary.expected_number_of_awards}
//                 </div>
//               </td>
//               <td className="display-block tablet:display-table-cell">
//                 {isNil(result.summary.award_floor)
//                   ? "$--"
//                   : formatCurrency(result.summary.award_floor)}
//               </td>
//               <td className="display-block tablet:display-table-cell">
//                 {isNil(result.summary.award_ceiling)
//                   ? "$--"
//                   : formatCurrency(result.summary.award_ceiling)}
//               </td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </Table>
//   );
// };
