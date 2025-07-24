import { ReactElement } from "react";

import { SortDirection } from "src/components/application/attachments/attachmentUtils";

interface TableHeaderProps<SortKey extends string> {
  isSortable?: boolean;
  sortKey?: SortKey;
  value: string;
  currentSortKey?: SortKey;
  currentSortDirection?: SortDirection;
  onSort?: (key: SortKey) => void;
}

export const TableHeader = <SortKey extends string>({
  isSortable = false,
  sortKey,
  value,
  currentSortKey,
  currentSortDirection,
  onSort,
}: TableHeaderProps<SortKey>): ReactElement<HTMLTableCellElement> => (
  <th
    {...(isSortable ? { "data-sortable": null } : {})}
    scope="col"
    className={`bg-base-lightest padding-y-205 ${isSortable ? "cursor-pointer" : ""}`}
    onClick={() => isSortable && sortKey && onSort?.(sortKey)}
  >
    {value}{" "}
    {isSortable && currentSortKey === sortKey
      ? currentSortDirection === "desc"
        ? "↑"
        : "↓"
      : null}
  </th>
);
