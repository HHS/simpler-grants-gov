import { ATTRIBUTE_LABELS, SOURCE_LABELS } from "@/lib/comparison";
import { $focusedCell } from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import CategoryBadge from "./CategoryBadge";
import OptionsDiff from "./OptionsDiff";
import ValuePair from "./ValuePair";

/** The selected cell in full: both values, its status and the reason for it. */
export default function CellDetail() {
  const focused = useStore($focusedCell);
  if (!focused)
    return (
      <p className="cell-detail cell-detail--empty">
        Matches every source it is compared with. Select a dot to see the
        values.
      </p>
    );
  const { attribute, source, row, cell } = focused;
  const sourceLabel = SOURCE_LABELS[source];
  return (
    <section className="cell-detail" aria-live="polite">
      <h3 className="cell-detail__title">
        {ATTRIBUTE_LABELS[attribute]} · {sourceLabel}
        <CategoryBadge status={cell.status} />
      </h3>
      {cell.options ? (
        <OptionsDiff options={cell.options} />
      ) : (
        <ValuePair
          plan={cell.plan !== undefined ? cell.plan : row.plan}
          value={cell.value}
          sourceLabel={sourceLabel}
        />
      )}
      {cell.reason && <p className="cell-detail__reason">{cell.reason}</p>}
    </section>
  );
}
