import { STATUS, type Status } from "@/lib/comparison";

import StatusDot from "./StatusDot";

interface Props {
  status: Status;
  /** Shown before the label, e.g. "2 intentional". */
  count?: number;
}

export default function CategoryBadge({ status, count }: Props) {
  const { label, short } = STATUS[status];
  return (
    <span className={`category-badge category-badge--${status}`}>
      <StatusDot status={status} />
      {count === undefined
        ? label
        : `${count} ${(short ?? label).toLowerCase()}`}
    </span>
  );
}
