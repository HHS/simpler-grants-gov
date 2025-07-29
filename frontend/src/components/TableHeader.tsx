import { AttachmentSortKey } from "src/types/attachment/attachmentSortKeyType";
import { SortDirection } from "src/types/sortDirectionType";

import { ReactElement } from "react";

interface TableHeaderProps {
  isSortable?: boolean;
  sortKey?: AttachmentSortKey;
  value: string;
  currentSortKey?: AttachmentSortKey;
  currentSortDirection?: SortDirection;
  onSort?: (key: AttachmentSortKey) => void;
}

export const TableHeader = ({
  isSortable = false,
  sortKey,
  value,
  currentSortKey,
  currentSortDirection,
  onSort,
}: TableHeaderProps): ReactElement<HTMLTableCellElement> => (
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
