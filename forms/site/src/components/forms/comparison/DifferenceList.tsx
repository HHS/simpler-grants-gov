import {
  $differenceCount,
  $selectedFindingOutsideFilters,
  $visibleDifferences,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import DifferenceCard from "./DifferenceCard";
import DiffTypeFilter from "./DiffTypeFilter";

/** Only the field's differences, one card each. */
export default function DifferenceList() {
  const differences = useStore($visibleDifferences);
  const count = useStore($differenceCount);
  const outside = useStore($selectedFindingOutsideFilters);
  return (
    <div className="difference-list">
      <DiffTypeFilter />
      {outside && (
        <p role="status">Linked finding shown outside current filters.</p>
      )}
      {differences.length ? (
        <ul className="difference-list__cards">
          {differences.map((d) => (
            <DifferenceCard key={`${d.attribute}-${d.source}`} difference={d} />
          ))}
        </ul>
      ) : (
        <p className="text-base">
          {count > 0
            ? "No differences match the current filters."
            : "No differences. This field matches every source it is compared with."}
        </p>
      )}
    </div>
  );
}
