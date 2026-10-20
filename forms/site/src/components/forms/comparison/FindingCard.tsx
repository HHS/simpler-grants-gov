import { STATUS } from "@/lib/comparison";
import {
  ARTIFACT_LABELS,
  findingDimension,
  findingDimensionLabel,
} from "@/lib/findings";
import type { Finding } from "@parity/index.ts";

import CategoryBadge from "./CategoryBadge";
import { DifferenceCardFrame } from "./DifferenceCard";
import ValuePair from "./ValuePair";

const displayValue = (value: unknown): string =>
  typeof value === "string" ? value || '""' : JSON.stringify(value);

/** Original check evidence, including records and source items with no field-tree row. */
export default function FindingCard({ finding }: { finding: Finding }) {
  const { values, anchors, entry, recordAs } = finding;
  return (
    <DifferenceCardFrame
      title={`${findingDimensionLabel(findingDimension(finding))} · ${finding.checkTitle}`}
      badge={<CategoryBadge status={finding.status} />}
      reason={entry?.reason}
    >
      {values && (
        <ValuePair
          planLabel={
            anchors[0] ? ARTIFACT_LABELS[anchors[0].artifact] : "Left artifact"
          }
          sourceLabel={
            anchors[1] ? ARTIFACT_LABELS[anchors[1].artifact] : "Right artifact"
          }
          plan={displayValue(values.plan)}
          value={displayValue(values.source)}
        />
      )}
      <p className="finding-card__paths">
        {anchors.map((anchor, index) => (
          <span key={`${anchor.artifact}-${index}`}>
            {ARTIFACT_LABELS[anchor.artifact]}: <code>{anchor.path}</code>
            {index < anchors.length - 1 ? " · " : ""}
          </span>
        ))}
      </p>
      <details className="finding-card__details">
        <summary>Check details</summary>
        <p>
          <code>{finding.kind}</code>
        </p>
        {finding.detail && <p>{finding.detail}</p>}
        <p>
          Check path: <code>{finding.path}</code>
        </p>
        {values && (
          <p>
            Recorded values: <code>{JSON.stringify(values)}</code>
          </p>
        )}
        {entry && <p>Recorded category: {STATUS[entry.category].label}</p>}
        {recordAs && (
          <p>
            Record as{" "}
            <code>
              {recordAs.register}: {recordAs.key}
            </code>
          </p>
        )}
      </details>
    </DifferenceCardFrame>
  );
}
