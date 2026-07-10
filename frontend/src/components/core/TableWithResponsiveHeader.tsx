import clsx from "clsx";

import { ReactNode } from "react";
import { Table } from "@trussworks/react-uswds";

export type TableCellData = {
  cellData: ReactNode;
  stackOrder?: number; // -1 to hide
  className?: string;
  style?: object;
};

export const TableWithResponsiveHeader = ({
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

  const headerNodes = headerContent.map((headerItem, i) => {
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
  });

  const dataRows = tableRowData.map((tableRow, i) => {
    return (
      <tr
        key={`responsiveTableRow-${i}`}
        className="border-base border-x border-y tablet-lg:border-0"
      >
        {tableRow.map((tableCell, j) => {
          const stackOrder = tableCell.stackOrder || 0;
          return (
            <td
              key={`responsiveTableCell-${i}-${j}`}
              style={headerContent[j].style}
              className={clsx(
                "tablet-lg:display-table-cell",
                "border-base",
                `order-${stackOrder}`,
                `tablet-lg:order-${j}`,
                tableCell.className,
                {
                  "display-none": stackOrder < 0,
                  "display-block": stackOrder > -1,
                },
              )}
            >
              <div className="display-flex flex-align-center">
                <div
                  className="tablet-lg:display-none flex-1 text-bold"
                  data-testid={`responsive-header-${i}-${j}`}
                >
                  {headerContent[j].cellData}
                </div>
                <div
                  className="flex-2"
                  data-testid={`responsive-data-${i}-${j}`}
                >
                  {tableCell.cellData}
                </div>
              </div>
            </td>
          );
        })}
      </tr>
    );
  });

  return (
    <Table className="simpler-responsive-table width-full tablet-lg:width-auto border-base tablet-lg:border-0">
      <thead>
        <tr>{headerNodes}</tr>
      </thead>
      <tbody>{dataRows}</tbody>
    </Table>
  );
};
