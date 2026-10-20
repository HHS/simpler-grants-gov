import {
  fieldCount,
  type DiffType,
  type VisibleSection,
} from "@/lib/comparison";
import type { ReactNode } from "react";

import SectionMeta from "../SectionMeta";
import SectionSummary from "../SectionSummary";
import RollupBadges from "./RollupBadges";

interface Props {
  node: VisibleSection;
  /** The labels of the section's visible children, in order. */
  contents: string[];
  /** 0 for a top-level section. */
  depth: number;
  counts: Record<DiffType, number>;
  filtering: boolean;
  children: ReactNode;
}

export default function FieldSection({
  node,
  contents,
  depth,
  counts,
  filtering,
  children,
}: Props) {
  const shown = fieldCount(node);
  const unit = node.total === 1 ? "field" : "fields";
  const count = filtering
    ? `${shown} of ${node.total} ${unit}`
    : `${node.total} ${unit}`;
  return (
    <details
      className={
        depth ? "field-section field-section--nested" : "field-section"
      }
      open
    >
      <summary>
        <SectionSummary
          section={node.section}
          count={count}
          badges={<RollupBadges counts={counts} />}
          contents={contents}
        />
      </summary>
      <SectionMeta section={node.section} />
      <div className="field-section__body">{children}</div>
    </details>
  );
}
