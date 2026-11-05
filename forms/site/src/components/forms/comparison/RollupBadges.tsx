import { STATUS, TALLY_KEYS, type Tally } from "@/lib/comparison";

import StatusDot from "./StatusDot";

/** A section's differences, summed over its fields: one dot and count per kind. */
export default function RollupBadges({ counts }: { counts: Tally }) {
  const present = TALLY_KEYS.filter((key) => counts[key] > 0);
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
