/**
 * Pure helpers for the form library's collapsible list (`components/forms/preview/
 * collapsible/`): how a list entry's fields group, and how a collapsed entry reads.
 */
import type { UISchemaElement } from "@jsonforms/core";

/** The widget name `specs/ui/widgets.tsp` declares for the collapsible list. */
export const COLLAPSIBLE_FIELD_LIST = "CollapsibleFieldList";

export const widgetOf = (element: UISchemaElement): unknown =>
  (element.options as { widget?: unknown } | undefined)?.widget;

/** A JSON Forms scope as the property path it names, e.g. `#/properties/name` -> `["name"]`. */
export function scopePath(scope: string): string[] {
  return scope
    .replace(/^#\/?/, "")
    .split("/")
    .filter((part, index) => part && index % 2 === 1);
}

const startsWith = (path: readonly string[], prefix: readonly string[]) =>
  prefix.every((part, index) => path[index] === part);

/** A list entry laid out by the list's `options.detail`: its groups, and the fields in them. */
export type EntryNode<F> =
  | { kind: "field"; field: F }
  | { kind: "group"; label: string; children: EntryNode<F>[] };

/**
 * An entry's fields arranged by the detail layout: each labeled group inside it keeps its
 * fields, and a control takes every field stored beneath its path. Fields the layout never
 * names follow at the end, so none is lost.
 */
export function entryLayout<F extends { storagePath: string[] }>(
  detail: UISchemaElement | undefined,
  fields: readonly F[],
): EntryNode<F>[] {
  const placed = new Set<F>();
  const walk = (element: UISchemaElement): EntryNode<F>[] => {
    if ("scope" in element && typeof element.scope === "string") {
      const path = scopePath(element.scope);
      return fields
        .filter(
          (field) => !placed.has(field) && startsWith(field.storagePath, path),
        )
        .map((field) => {
          placed.add(field);
          return { kind: "field", field };
        });
    }
    const children =
      "elements" in element && Array.isArray(element.elements)
        ? (element.elements as UISchemaElement[]).flatMap(walk)
        : [];
    const label = (element as { label?: unknown }).label;
    if (
      element.type === "Group" &&
      typeof label === "string" &&
      children.length
    )
      return [{ kind: "group", label, children }];
    return children;
  };
  // The detail's own group is the entry itself, which the list already heads.
  const laidOut =
    detail && "elements" in detail && Array.isArray(detail.elements)
      ? (detail.elements as UISchemaElement[]).flatMap(walk)
      : detail
        ? walk(detail)
        : [];
  const rest = fields.filter((field) => !placed.has(field));
  return [
    ...laidOut,
    ...rest.map((field) => ({ kind: "field" as const, field })),
  ];
}

/** Every field under some entry nodes, in order. */
export function entryFields<F>(nodes: readonly EntryNode<F>[]): F[] {
  return nodes.flatMap((node) =>
    node.kind === "field" ? [node.field] : entryFields(node.children),
  );
}

/** A run of a collapsed entry's answers, under the group they belong to if any. */
export interface SummarySection<S> {
  label?: string;
  items: S[];
}

/**
 * A collapsed entry's answers split the way its layout groups them: the fields outside any
 * group in runs of their own, and each group's fields, nested ones included, under its label.
 */
export function summarySections<F, S>(
  nodes: readonly EntryNode<F>[],
  summaryOf: (field: F) => S,
): SummarySection<S>[] {
  const sections: SummarySection<S>[] = [];
  for (const node of nodes) {
    if (node.kind === "group") {
      sections.push({
        label: node.label,
        items: entryFields(node.children).map(summaryOf),
      });
    } else {
      const last = sections.at(-1);
      if (last && last.label === undefined)
        last.items.push(summaryOf(node.field));
      else sections.push({ items: [summaryOf(node.field)] });
    }
  }
  return sections;
}

/** One answer as a collapsed section lists it. */
export interface SummaryItem {
  label: string;
  value: unknown;
  required: boolean;
  /** For a choice, the label shown for each stored value. */
  enumOptions?: readonly { value: unknown; label: string }[];
  /** An attachment stores file ids, so it reads as a count of files. */
  attachment?: boolean;
}

export interface SummaryRow {
  label: string;
  value: string;
  status: "filled" | "blank" | "missing";
}

const isBlank = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

/** An answer as text: the choice's label, Yes/No, a file count, or the value itself. */
export function displayValue(item: SummaryItem): string | undefined {
  const { value } = item;
  if (isBlank(value)) return undefined;
  if (item.attachment) {
    const count = Array.isArray(value) ? value.length : 1;
    return `${count} ${count === 1 ? "file" : "files"}`;
  }
  const labelOf = (v: unknown) =>
    item.enumOptions?.find((option) => String(option.value) === String(v))
      ?.label ?? (typeof v === "boolean" ? (v ? "Yes" : "No") : String(v));
  return Array.isArray(value) ? value.map(labelOf).join(", ") : labelOf(value);
}

/** Every answer of a collapsed section: blanks read "—", or "Missing" when required. */
export function summaryRows(items: readonly SummaryItem[]): SummaryRow[] {
  return items.map((item) => {
    const value = displayValue(item);
    if (value !== undefined)
      return { label: item.label, value, status: "filled" };
    return item.required
      ? { label: item.label, value: "Missing", status: "missing" }
      : { label: item.label, value: "—", status: "blank" };
  });
}

export const isStarted = (items: readonly SummaryItem[]) =>
  items.some((item) => displayValue(item) !== undefined);

/**
 * What a list entry is called once collapsed: the person's name when it has a `name` group,
 * otherwise its first answer, otherwise just its number.
 */
export function entryTitle(
  items: readonly (SummaryItem & { storagePath: string[] })[],
  fallback: string,
): string {
  const name = items
    .filter((item) => item.storagePath[0] === "name")
    .map(displayValue)
    .filter(Boolean)
    .join(" ");
  return name || items.map(displayValue).find(Boolean) || fallback;
}
