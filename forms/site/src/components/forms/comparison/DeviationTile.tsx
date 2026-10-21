import type { DisplayStatus, FilterKey } from "@/lib/comparison";
import {
  $categoryCounts,
  $categoryFilter,
  toggleCategory,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import StatusDot from "./StatusDot";

const TITLES: Record<FilterKey, string> = {
  gap: "Known gaps",
  upstream: "Upstream discrepancies",
  intentional: "Intentional differences",
  matches: "Matches every source",
};

/** A controlled filter tile, shared by field and original-finding counts. */
export function DeviationTileView({
  status,
  title,
  count,
  description,
  pressed,
  onClick,
}: {
  status: DisplayStatus;
  title: string;
  count: number;
  description: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`deviation-tile deviation-tile--${status}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <span className="deviation-tile__heading">
        <StatusDot status={status} />
        {title}
      </span>
      <span className="deviation-tile__count">{count}</span>
      <span className="deviation-tile__fields">{description}</span>
    </button>
  );
}

/** A filter for one category: its count, and how many fields it covers. */
export default function DeviationTile({ filterKey }: { filterKey: FilterKey }) {
  const { count, fields } = useStore($categoryCounts)[filterKey];
  const pressed = useStore($categoryFilter).includes(filterKey);
  const status = filterKey === "matches" ? "match" : filterKey;
  const noun = fields === 1 ? "field" : "fields";
  return (
    <DeviationTileView
      status={status}
      title={TITLES[filterKey]}
      count={count}
      description={filterKey === "matches" ? noun : `in ${fields} ${noun}`}
      pressed={pressed}
      onClick={() => toggleCategory(filterKey)}
    />
  );
}
