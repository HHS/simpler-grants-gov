import { DIFF_TYPES, STATUS } from "@/lib/comparison";
import {
  $diffTypeCounts,
  $diffTypeFilter,
  toggleDiffType,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import StatusDot from "./StatusDot";

/** Chips that narrow the Differences tab to some categories. */
export default function DiffTypeFilter() {
  const counts = useStore($diffTypeCounts);
  const selected = useStore($diffTypeFilter);
  return (
    <div
      className="diff-type-filter"
      role="group"
      aria-label="Filter differences by type"
    >
      {DIFF_TYPES.filter((type) => counts[type] > 0).map((type) => (
        <button
          key={type}
          type="button"
          className={`diff-type-filter__chip category-badge category-badge--${type}`}
          aria-pressed={selected.includes(type)}
          onClick={() => toggleDiffType(type)}
        >
          <StatusDot status={type} />
          {STATUS[type].label} ({counts[type]})
        </button>
      ))}
    </div>
  );
}
