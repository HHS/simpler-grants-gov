import { DIFF_TYPES, type FieldComparison } from "@/lib/comparison";

import CategoryBadge from "./CategoryBadge";

/** One badge per category the field differs in, or a single "Matches" badge. */
export default function DeviationBadges({
  counts,
}: {
  counts: FieldComparison["counts"];
}) {
  const present = DIFF_TYPES.filter((type) => counts[type] > 0);
  return (
    <span className="deviation-badges">
      {present.length ? (
        present.map((type) => (
          <CategoryBadge key={type} status={type} count={counts[type]} />
        ))
      ) : (
        <CategoryBadge status="match" />
      )}
    </span>
  );
}
