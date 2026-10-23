type Node = {
  kind: string;
  json_path?: string;
  children?: Node[];
};

/** Check answer locations only; a plan is not a schema for example values or rules. */
export function undeclaredExamplePaths(nodes: Node[], data: unknown): string[] {
  const fields = new Set<string>();
  const collect = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.kind === "field" && node.json_path) fields.add(node.json_path);
      collect(node.children ?? []);
    }
  };
  collect(nodes);

  const contains = (path: string) =>
    [...fields].some(
      (field) =>
        field === path ||
        field.startsWith(`${path}.`) ||
        field.startsWith(`${path}[]`),
    );
  const unknown: string[] = [];
  const visit = (value: unknown, path: string) => {
    // A field may itself hold an object. Its internal contract belongs to the definition.
    if (fields.has(path)) return;
    if (Array.isArray(value)) {
      const item = `${path}[]`;
      if (!contains(item)) unknown.push(path);
      else value.forEach((entry) => visit(entry, item));
    } else if (value !== null && typeof value === "object") {
      if (path && !contains(path)) unknown.push(path);
      else
        for (const [key, entry] of Object.entries(value))
          visit(entry, path ? `${path}.${key}` : key);
    } else unknown.push(path);
  };
  visit(data, "");
  return [...new Set(unknown)];
}
