import {
  $attributeFilter,
  $categoryFilter,
  $comparison,
  $visibleTree,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import TreeNodes from "./TreeNodes";

/** The plan's tree, cut down to the fields the current filter shows. */
export default function FieldTree() {
  const nodes = useStore($visibleTree);
  const { fields } = useStore($comparison);
  const filter = useStore($categoryFilter);
  const attributes = useStore($attributeFilter);
  if (!nodes.length)
    return <p className="text-base">No fields match this filter.</p>;
  const byId = new Map(fields.map((field) => [field.id, field]));
  return (
    <div className="field-tree">
      <TreeNodes
        nodes={nodes}
        fields={byId}
        filter={filter}
        attributes={attributes}
      />
    </div>
  );
}
