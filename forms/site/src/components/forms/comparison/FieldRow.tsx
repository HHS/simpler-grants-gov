import {
  countsIn,
  requiredLabel,
  type FieldComparison,
} from "@/lib/comparison";
import { openField } from "@/stores/fieldComparison";

import DeviationBadges from "./DeviationBadges";
import FieldDetails from "./FieldDetails";

/** A plan field as the field tree shows it, with a button that opens its comparison. */
export default function FieldRow({
  comparison,
}: {
  comparison: FieldComparison;
}) {
  const { field } = comparison;
  const required = requiredLabel(field);
  const tertiary = [field.type, field.widget, field.constraints].filter(
    Boolean,
  );
  return (
    <div className="field-row field-row--compare">
      <div className="field-row__plan">
        <div className="field-row__primary">
          <span className="field-row__label">{field.label}</span>
          {required ? (
            <span className="field-row__required">{required}</span>
          ) : (
            <span className="field-row__optional">Optional</span>
          )}
        </div>
        {field.help_text && (
          <div className="field-row__help">{field.help_text}</div>
        )}
        <div className="field-row__tertiary">{tertiary.join(" · ")}</div>
        <FieldDetails field={field} />
      </div>
      <button
        type="button"
        className="field-row__compare"
        aria-haspopup="dialog"
        aria-label={`Compare ${field.label} with its sources`}
        onClick={() => openField(comparison.id)}
      >
        <DeviationBadges counts={countsIn(comparison)} />
        <span className="field-row__open" aria-hidden="true">
          Compare ›
        </span>
      </button>
    </div>
  );
}
