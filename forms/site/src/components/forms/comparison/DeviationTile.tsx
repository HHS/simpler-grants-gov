import type { FilterKey } from "@/lib/comparison";
import {
  $categoryCounts,
  $categoryFilter,
  toggleCategory,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import StatusDot from "./StatusDot";

const TITLES: Record<FilterKey, string> = {
  unrecorded: "Unrecorded differences",
  gap: "Known gaps",
  upstream: "Upstream discrepancies",
  intentional: "Intentional differences",
  matches: "Matches every source",
};

/** A filter for one category: its count, and how many fields it covers. */
export default function DeviationTile({ filterKey }: { filterKey: FilterKey }) {
  const { count, fields } = useStore($categoryCounts)[filterKey];
  const pressed = useStore($categoryFilter).includes(filterKey);
  const status = filterKey === "matches" ? "match" : filterKey;
  const noun = fields === 1 ? "field" : "fields";
  return (
    <button
      type="button"
      className={`deviation-tile deviation-tile--${status}`}
      aria-pressed={pressed}
      onClick={() => toggleCategory(filterKey)}
    >
      <span className="deviation-tile__heading">
        <StatusDot status={status} />
        {TITLES[filterKey]}
      </span>
      <span className="deviation-tile__count">{count}</span>
      <span className="deviation-tile__fields">
        {filterKey === "matches" ? noun : `in ${fields} ${noun}`}
      </span>
    </button>
  );
}
