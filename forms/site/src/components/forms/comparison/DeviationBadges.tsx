import { TALLY_KEYS, type Tally } from "@/lib/comparison";

import CategoryBadge from "./CategoryBadge";

/** One badge per kind of difference the field has, or a single "Matches" badge. */
export default function DeviationBadges({ counts }: { counts: Tally }) {
  const present = TALLY_KEYS.filter((key) => counts[key] > 0);
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
