import { DIFF_TYPES, STATUS, type DiffType } from "@/lib/comparison";

import StatusDot from "./StatusDot";

/** A section's differences, summed over its fields: one dot and count per category. */
export default function RollupBadges({
  counts,
}: {
  counts: Record<DiffType, number>;
}) {
  const present = DIFF_TYPES.filter((type) => counts[type] > 0);
  return (
    <span className="rollup-badges">
      {present.length ? (
        present.map((type) => (
          <span key={type} className="rollup-badge">
            <StatusDot status={type} />
            {counts[type]}
            <span className="usa-sr-only">
              {" "}
              {STATUS[type].label.toLowerCase()}
            </span>
          </span>
        ))
      ) : (
        <span className="rollup-badge">
          <StatusDot status="match" />
          <span className="usa-sr-only">Matches every source</span>
        </span>
      )}
    </span>
  );
}
