import {
  ATTRIBUTE_LABELS,
  SOURCE_LABELS,
  STATUS,
  type AttributeRow,
  type Source,
} from "@/lib/comparison";
import { $focusedCell, selectCell } from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import StatusDot from "./StatusDot";

interface Props {
  row: AttributeRow;
  source: Source;
}

/** One source's status for one attribute; selecting it shows the values below the matrix. */
export default function StatusCell({ row, source }: Props) {
  const focused = useStore($focusedCell);
  const { attribute } = row;
  const pressed = focused?.attribute === attribute && focused.source === source;
  const { status } = row.cells[source];
  return (
    <td className="status-matrix__cell">
      <button
        type="button"
        className="status-matrix__button"
        aria-pressed={pressed}
        aria-label={`${SOURCE_LABELS[source]} ${ATTRIBUTE_LABELS[attribute].toLowerCase()}: ${STATUS[status].label}`}
        onClick={() => selectCell({ attribute, source })}
      >
        <StatusDot status={status} />
      </button>
    </td>
  );
}
