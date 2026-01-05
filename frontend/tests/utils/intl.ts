export type MessagesTree = Record<string, unknown>;

export function getMessage(tree: MessagesTree, dottedKey: string): string {
  const value = dottedKey
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, tree);

  return typeof value === "string" ? value : dottedKey;
}
