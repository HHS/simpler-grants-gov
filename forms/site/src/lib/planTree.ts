import type { FieldNode, FormNode } from "@/content.config";

/** Every field under `nodes`, depth first in plan order. */
export function walkFields(nodes: FormNode[]): FieldNode[] {
  return nodes.flatMap((node) =>
    node.kind === "section" ? walkFields(node.children) : [node],
  );
}

export function countFields(nodes: FormNode[]): number {
  return walkFields(nodes).length;
}
