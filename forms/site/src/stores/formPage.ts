import {
  ATTRIBUTE_LABELS,
  DIFF_TYPES,
  FILTER_KEYS,
  SOURCES,
  type Attribute,
  type CellRef,
  type DiffType,
  type FilterKey,
} from "@/lib/comparison";
import { atom } from "nanostores";

import {
  $attributeFilter,
  $categoryFilter,
  $diffTypeFilter,
  $selectedCell,
  $selectedFieldId,
  $sheetTab,
} from "./fieldComparison";
import { $schemaFile, $sourceFile } from "./formArtifacts";
import { $dataView, type DataView } from "./formPreview";

export const PAGE_TABS = [
  "fields",
  "preview",
  "data",
  "notes",
  "schemas",
  "source",
  "xml-mapping",
] as const;
export type PageTab = (typeof PAGE_TABS)[number];
export const $pageTab = atom<PageTab>("fields");
export const $linkNotice = atom("");

// These slugs are a review-link contract, not generated from a display label or answer path.
const ATTRIBUTE_SLUGS: Record<Attribute, string> = {
  matchedBy: "matched-by",
  label: "label",
  help: "help-text",
  required: "required",
  length: "length",
  format: "format",
  range: "range",
  options: "options",
  position: "position",
  xmlMapping: "xml-mapping",
};
export const CHECKS: ReadonlyMap<string, CellRef> = new Map(
  SOURCES.flatMap((source) =>
    Object.entries(ATTRIBUTE_SLUGS).map(
      ([attribute, slug]) =>
        [
          `plan-vs-${source}-${slug}`,
          { source, attribute: attribute as Attribute },
        ] as const,
    ),
  ),
);
export const checkSlug = (cell: CellRef) =>
  `plan-vs-${cell.source}-${ATTRIBUTE_SLUGS[cell.attribute]}`;

export interface PageState {
  tab: PageTab;
  field: string | null;
  check: string | null;
  sheet: "comparison" | "differences";
  categories: FilterKey[];
  attributes: Attribute[];
  differences: DiffType[];
  data: DataView;
  schema: string;
  source: string;
}
const allowed = <T extends string>(
  params: URLSearchParams,
  key: string,
  values: readonly T[],
): T[] => [
  ...new Set(
    params
      .getAll(key)
      .filter((value): value is T => values.includes(value as T)),
  ),
];

export function parsePageState(params: URLSearchParams): PageState {
  const requested = params.get("tab");
  return {
    // Findings are already presented in the field comparison's Differences sheet.
    tab: PAGE_TABS.includes(requested as PageTab)
      ? (requested as PageTab)
      : "fields",
    field: params.get("field") || null,
    check: params.get("check") || null,
    sheet: requested === "findings" ? "differences" : "comparison",
    categories: allowed(params, "category", FILTER_KEYS),
    attributes: allowed(
      params,
      "attribute",
      Object.keys(ATTRIBUTE_LABELS) as Attribute[],
    ),
    differences: allowed(params, "difference", DIFF_TYPES),
    data: params.get("data") === "xml" ? "xml" : "json",
    schema: params.get("schema") || "schema.json",
    source: params.get("source") || "index.tsp",
  };
}

export function currentPageState(): PageState {
  const cell = $selectedCell.get();
  return {
    tab: $pageTab.get(),
    field: $selectedFieldId.get(),
    check: cell ? checkSlug(cell) : null,
    sheet: $sheetTab.get(),
    categories: $categoryFilter.get(),
    attributes: $attributeFilter.get(),
    differences: $diffTypeFilter.get(),
    data: $dataView.get(),
    schema: $schemaFile.get(),
    source: $sourceFile.get(),
  };
}

/** Preserve other page parameters; only this adapter's own keys are replaced. */
export function pageUrl(url: URL, state: PageState): string {
  const next = new URL(url);
  for (const key of [
    "tab",
    "field",
    "check",
    "category",
    "attribute",
    "difference",
    "data",
    "schema",
    "source",
  ])
    next.searchParams.delete(key);
  const params = next.searchParams;
  if (state.tab !== "fields" || state.sheet === "differences")
    params.set(
      "tab",
      state.tab === "fields" && state.sheet === "differences"
        ? "findings"
        : state.tab,
    );
  if (state.field) params.set("field", state.field);
  if (state.field && state.check) params.set("check", state.check);
  for (const value of state.categories) params.append("category", value);
  for (const value of state.attributes) params.append("attribute", value);
  for (const value of state.differences) params.append("difference", value);
  if (state.data !== "json") params.set("data", state.data);
  if (state.schema !== "schema.json") params.set("schema", state.schema);
  if (state.source !== "index.tsp") params.set("source", state.source);
  return `${next.pathname}${next.search}${next.hash}`;
}

export function restorePageState(state: PageState) {
  $pageTab.set(state.tab);
  $selectedFieldId.set(state.field);
  $selectedCell.set(state.check ? (CHECKS.get(state.check) ?? null) : null);
  $sheetTab.set(state.sheet);
  $categoryFilter.set(state.categories);
  $attributeFilter.set(state.attributes);
  $diffTypeFilter.set(state.differences);
  $dataView.set(state.data);
  $schemaFile.set(state.schema);
  $sourceFile.set(state.source);
}

/** Bind the existing stores once per page; restoring history never writes a new entry. */
export function startFormPage(
  host: Window,
  availableTabs: readonly string[],
): () => void {
  let restoring = false;
  let queued = false;
  let push = false;
  let disposed = false;
  let generation = 0;
  const restore = () => {
    restoring = true;
    const params = new URLSearchParams(host.location.search);
    const state = parsePageState(params);
    const notices: string[] = [];
    if (!availableTabs.includes(state.tab)) {
      state.tab = "fields";
      if (params.has("tab"))
        notices.push(
          "That view is not available for this form. Showing the field tree.",
        );
    } else if (
      params.has("tab") &&
      !PAGE_TABS.includes(params.get("tab") as PageTab) &&
      params.get("tab") !== "findings"
    ) {
      notices.push("That view no longer exists. Showing the field tree.");
    }
    if (state.check && !CHECKS.has(state.check))
      notices.push("That comparison no longer exists. Showing the field.");
    $linkNotice.set(notices.join(" "));
    restorePageState(state);
    restoring = false;
  };
  restore();
  const schedule = (major: boolean) => {
    if (restoring || disposed) return;
    if (major) $linkNotice.set("");
    push ||= major;
    if (queued) return;
    queued = true;
    const scheduled = generation;
    queueMicrotask(() => {
      if (disposed || scheduled !== generation) return;
      queued = false;
      const next = pageUrl(new URL(host.location.href), currentPageState());
      const method = push ? "pushState" : "replaceState";
      push = false;
      if (
        next !==
        `${host.location.pathname}${host.location.search}${host.location.hash}`
      )
        host.history[method](null, "", next);
    });
  };
  const unlisten = [
    ...[$pageTab, $selectedFieldId, $selectedCell, $sheetTab].map((store) =>
      store.listen(() => schedule(true)),
    ),
    ...[
      $categoryFilter,
      $attributeFilter,
      $diffTypeFilter,
      $dataView,
      $schemaFile,
      $sourceFile,
    ].map((store) => store.listen(() => schedule(false))),
  ];
  // Cancel any pending write from the previous view before restoring a history entry.
  const onPop = () => {
    generation += 1;
    queued = false;
    push = false;
    restore();
  };
  host.addEventListener("popstate", onPop);
  return () => {
    disposed = true;
    unlisten.forEach((stop) => stop());
    host.removeEventListener("popstate", onPop);
  };
}
