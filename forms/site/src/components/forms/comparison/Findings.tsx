import {
  findingCategoryCounts,
  findingDimensionCounts,
  findingDimensionLabel,
  visibleFindings,
  type FindingCategory,
} from "@/lib/findings";
import type { Finding } from "@parity/index.ts";
import { useState } from "react";

import { AttributeFilterChip } from "./AttributeFilter";
import { DeviationTileView } from "./DeviationTile";
import FindingCard from "./FindingCard";

const toggle = <T,>(items: readonly T[], item: T) =>
  items.includes(item)
    ? items.filter((other) => other !== item)
    : [...items, item];
const TITLES: Record<FindingCategory, string> = {
  gap: "Known gaps",
  upstream: "Upstream discrepancies",
  intentional: "Intentional differences",
  unrecorded: "Unrecorded differences",
  stale: "Stale records",
};

/** An independent island: raw findings never enter the field tree's stores or cell counts. */
export default function Findings({ findings }: { findings: Finding[] }) {
  const [categories, setCategories] = useState<FindingCategory[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const shown = visibleFindings(findings, categories, dimensions);
  const filtering = categories.length > 0 || dimensions.length > 0;
  const categoryCounts = findingCategoryCounts(findings, dimensions);
  const dimensionCounts = findingDimensionCounts(findings, categories);
  const clear = () => {
    setCategories([]);
    setDimensions([]);
  };
  return (
    <section aria-label="All parity findings">
      <p className="text-base">
        Original findings from every check, including source items without a
        field-tree row and stale records. Counts describe check findings, not
        affected fields; several checks can report the same field.
      </p>
      <div className="deviation-tiles">
        <div
          className="deviation-tiles__grid"
          role="group"
          aria-label="Filter findings by category"
        >
          {categoryCounts
            .filter(
              ({ category }) =>
                !["unrecorded", "stale"].includes(category) ||
                findings.some((f) => f.status === category),
            )
            .map(({ category, count }) => (
              <DeviationTileView
                key={category}
                status={category}
                title={TITLES[category]}
                count={count}
                description={count === 1 ? "check finding" : "check findings"}
                pressed={categories.includes(category)}
                onClick={() => setCategories(toggle(categories, category))}
              />
            ))}
        </div>
        {dimensionCounts.length > 0 && (
          <div
            className="attribute-filter"
            role="group"
            aria-label="Filter findings by what differs"
          >
            <span className="attribute-filter__label">Differs in</span>
            {dimensionCounts.map(({ dimension, count }) => (
              <AttributeFilterChip
                key={dimension}
                label={findingDimensionLabel(dimension)}
                count={count}
                selected={dimensions.includes(dimension)}
                title={`${count} ${count === 1 ? "check finding" : "check findings"}`}
                onClick={() => setDimensions(toggle(dimensions, dimension))}
              />
            ))}
          </div>
        )}
        <p className="deviation-tiles__clear" role="status">
          {filtering && (
            <>
              <button
                type="button"
                className="usa-button--unstyled"
                onClick={clear}
              >
                Clear filter
              </button>
              {" · "}
            </>
          )}
          Showing {shown.length} of {findings.length} check{" "}
          {findings.length === 1 ? "finding" : "findings"}
        </p>
      </div>
      {dimensionCounts.some(({ dimension }) =>
        ["missing", "extra"].includes(dimension),
      ) && (
        <p className="text-base">
          Missing and extra elements are relative to the first artifact named in
          each check. Each path is labeled with the artifact it belongs to.
        </p>
      )}
      {shown.length ? (
        <ul className="difference-list__cards">
          {shown.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </ul>
      ) : (
        <p className="text-base">
          {findings.length
            ? "No findings match this filter."
            : "No parity findings were reported by these checks."}
        </p>
      )}
    </section>
  );
}
