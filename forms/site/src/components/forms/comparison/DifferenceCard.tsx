import {
  ATTRIBUTE_LABELS,
  SOURCE_LABELS,
  type Difference,
} from "@/lib/comparison";
import type { ReactNode } from "react";

import CategoryBadge from "./CategoryBadge";
import OptionsDiff from "./OptionsDiff";
import ValuePair from "./ValuePair";

/** Shared card presentation; each consumer supplies its own evidence without reshaping it. */
export function DifferenceCardFrame({
  title,
  badge,
  children,
  reason,
}: {
  title: ReactNode;
  badge: ReactNode;
  children: ReactNode;
  reason?: string;
}) {
  return (
    <li className="difference-card">
      <p className="difference-card__title">
        <span>{title}</span>
        {badge}
      </p>
      {children}
      {reason && <p className="difference-card__reason">{reason}</p>}
    </li>
  );
}

export default function DifferenceCard({
  difference,
}: {
  difference: Difference;
}) {
  const { attribute, source, row, cell } = difference;
  const sourceLabel = SOURCE_LABELS[source];
  return (
    <DifferenceCardFrame
      title={`${ATTRIBUTE_LABELS[attribute]} vs ${sourceLabel}`}
      badge={<CategoryBadge status={cell.status} />}
      reason={cell.reason}
    >
      {cell.options ? (
        <OptionsDiff options={cell.options} />
      ) : (
        <ValuePair
          plan={cell.plan !== undefined ? cell.plan : row.plan}
          value={cell.value}
          sourceLabel={sourceLabel}
        />
      )}
    </DifferenceCardFrame>
  );
}
