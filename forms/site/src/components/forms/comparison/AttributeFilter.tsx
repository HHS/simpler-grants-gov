import { ATTRIBUTE_LABELS } from "@/lib/comparison";
import {
  $attributeCounts,
  $attributeFilter,
  toggleAttribute,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

/** Chips that narrow the tree to differences in some attributes: label, help, position… */
export default function AttributeFilter() {
  const counts = useStore($attributeCounts);
  const selected = useStore($attributeFilter);
  if (!counts.length) return null;
  return (
    <div
      className="attribute-filter"
      role="group"
      aria-label="Filter differences by what differs"
    >
      <span className="attribute-filter__label">Differs in</span>
      {counts.map(({ attribute, count, fields }) => (
        <button
          key={attribute}
          type="button"
          className="attribute-filter__chip"
          aria-pressed={selected.includes(attribute)}
          title={`${count} ${count === 1 ? "difference" : "differences"} in ${fields} ${fields === 1 ? "field" : "fields"}`}
          onClick={() => toggleAttribute(attribute)}
        >
          {ATTRIBUTE_LABELS[attribute]}
          <span className="attribute-filter__count">{count}</span>
        </button>
      ))}
    </div>
  );
}
