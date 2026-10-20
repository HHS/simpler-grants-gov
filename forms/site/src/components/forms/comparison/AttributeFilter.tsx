import { ATTRIBUTE_LABELS } from "@/lib/comparison";
import {
  $attributeCounts,
  $attributeFilter,
  toggleAttribute,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

/** A controlled chip, with count units supplied by its consumer. */
export function AttributeFilterChip({
  label,
  count,
  selected,
  title,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="attribute-filter__chip"
      aria-pressed={selected}
      title={title}
      onClick={onClick}
    >
      {label}
      <span className="attribute-filter__count">{count}</span>
    </button>
  );
}

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
        <AttributeFilterChip
          key={attribute}
          label={ATTRIBUTE_LABELS[attribute]}
          count={count}
          selected={selected.includes(attribute)}
          title={`${count} ${count === 1 ? "difference" : "differences"} in ${fields} ${fields === 1 ? "field" : "fields"}`}
          onClick={() => toggleAttribute(attribute)}
        />
      ))}
    </div>
  );
}
