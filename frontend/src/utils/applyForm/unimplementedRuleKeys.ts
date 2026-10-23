/*
  Finds the rules an SGG UI schema declares that the renderer doesn't act on, so
  getFormData can log them.
*/

/** Node keys this renderer reads. Anything else object-valued on a node is a rule it ignores. */
const IMPLEMENTED_NODE_KEYS = new Set([
  "type",
  "name",
  "label",
  "description",
  "content",
  "definition",
  "schema",
  "widget",
  "children",
  "printDescription",
  "hideFieldListHeading",
  "minItemsHeading",
  "minItemsHelperText",
  "maxItemsHeading",
  "maxItemsHelperText",
  "additionalDescribedById",
]);

/**
 * The rule keys present in a UI schema that this renderer does not act on.
 *
 * A form whose specification says a field is conditionally disabled renders it always
 * enabled, and nothing else says so. Reporting the keys lets the caller log that once per
 * form rather than leaving the difference between the artifact and the screen invisible.
 */
export const unimplementedRuleKeys = (data: unknown): string[] => {
  const found = new Set<string>();
  const visitNode = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visitNode);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        // A node's children are nodes; nothing else holds one.
        if (key === "children") value.forEach(visitNode);
        continue;
      }
      if (value === null || typeof value !== "object") continue;
      // An unread object property is a rule. Its own shape is the rule's business, so it is
      // named and not descended into -- otherwise every key inside it reads as a rule too.
      if (!IMPLEMENTED_NODE_KEYS.has(key)) found.add(key);
    }
  };
  visitNode(data);
  return [...found].sort();
};
