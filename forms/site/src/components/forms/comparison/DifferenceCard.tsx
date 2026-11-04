import {
  ATTRIBUTE_LABELS,
  SOURCE_LABELS,
  type Difference,
} from "@/lib/comparison";
import { $selectedField } from "@/stores/fieldComparison";
import { checkSlug } from "@/stores/formPage";
import { useStore } from "@nanostores/react";

import CategoryBadge from "./CategoryBadge";
import OptionsDiff from "./OptionsDiff";
import ReviewLink from "./ReviewLink";
import ValuePair from "./ValuePair";

export default function DifferenceCard({
  difference,
}: {
  difference: Difference;
}) {
  const { attribute, source, row, cell } = difference;
  const field = useStore($selectedField);
  const sourceLabel = SOURCE_LABELS[source];
  return (
    <li
      className="difference-card"
      data-check={checkSlug(difference)}
      tabIndex={-1}
    >
      <p className="difference-card__title">
        <span>
          {ATTRIBUTE_LABELS[attribute]} vs {sourceLabel}
        </span>
        <CategoryBadge status={cell.status} />
      </p>
      {cell.options ? (
        <OptionsDiff options={cell.options} />
      ) : (
        <ValuePair
          plan={cell.plan !== undefined ? cell.plan : row.plan}
          value={cell.value}
          sourceLabel={sourceLabel}
        />
      )}
      {cell.reason && <p className="difference-card__reason">{cell.reason}</p>}
      {field?.field.id && (
        <ReviewLink
          field={field.field.id}
          sheet="differences"
          check={checkSlug(difference)}
        />
      )}
    </li>
  );
}
