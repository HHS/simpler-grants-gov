import { readFile } from "node:fs/promises";
import DifferenceList from "@/components/forms/comparison/DifferenceList";
import FieldTree from "@/components/forms/comparison/FieldTree";
import type { FieldNode } from "@/content.config";
import { differences } from "@/lib/comparison";
import {
  $categoryFilter,
  $comparison,
  $diffTypeFilter,
  $selectedCell,
  $selectedField,
  $selectedFieldId,
  $visibleDifferences,
  $visibleFields,
} from "@/stores/fieldComparison";
import {
  checkSlug,
  parsePageState,
  restorePageState,
  startFormPage,
} from "@/stores/formPage";
import { compareForm } from "@parity/comparison.ts";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it } from "vitest";

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
  restorePageState(parsePageState(new URLSearchParams()));
  $comparison.set({ children: [], fields: [] });
});

async function linkedFinding(check = true) {
  const plan = JSON.parse(
    await readFile(
      new URL("../content/forms/key-contacts.json", import.meta.url),
      "utf8",
    ),
  );
  const comparison = (await compareForm<FieldNode>(plan))!;
  const field = comparison.fields.find(
    (entry) =>
      differences(entry).length > 0 &&
      differences(entry).every(
        (difference) => difference.cell.status !== "gap",
      ),
  )!;
  expect(field).toBeDefined();
  const finding = differences(field)[0];
  $comparison.set(comparison);
  const url = new URL("https://example.test/forms/key-contacts/");
  url.searchParams.set("tab", "findings");
  url.searchParams.set("field", field.id);
  if (check) url.searchParams.set("check", checkSlug(finding));
  url.searchParams.set("category", "gap");
  url.searchParams.set("difference", "gap");
  const host = new EventTarget() as unknown as Window;
  Object.defineProperty(host, "location", { value: url });
  Object.defineProperty(host, "history", {
    value: { pushState() {}, replaceState() {} },
  });
  stop = startFormPage(host, ["fields", "data"]);
  return { field, finding, url };
}

it("keeps a real linked field and finding visible outside its saved filters", async () => {
  const { field, finding, url } = await linkedFinding();
  expect($selectedField.get()).toBe(field);
  expect($visibleFields.get()).toContain(field);
  expect($visibleDifferences.get()).toContainEqual(finding);
  expect($categoryFilter.get()).toEqual(["gap"]);
  expect($diffTypeFilter.get()).toEqual(["gap"]);
  expect(url.searchParams.get("category")).toBe("gap");
  const tree = renderToStaticMarkup(<FieldTree />);
  const sheet = renderToStaticMarkup(<DifferenceList />);
  expect(tree).toContain(`data-field-id="${field.field.id}"`);
  expect(tree).toContain("Linked field shown outside current filters.");
  expect(sheet).toContain(`data-check="${checkSlug(finding)}"`);
  expect(sheet).toContain("Linked finding shown outside current filters.");
  expect(sheet).toContain(`category-badge--${finding.cell.status}`);
  expect(sheet).not.toContain("This field matches every source");
});

it("does not call filtered-out differences a field that matches every source", async () => {
  const { field } = await linkedFinding(false);
  expect(differences(field).length).toBeGreaterThan(0);
  expect($selectedCell.get()).toBeNull();
  expect($visibleDifferences.get()).toEqual([]);
  const sheet = renderToStaticMarkup(<DifferenceList />);
  expect(sheet).toContain("No differences match the current filters.");
  expect(sheet).not.toContain("This field matches every source");
});

it("never fabricates a removed field or finding to bypass filters", async () => {
  await linkedFinding();
  $selectedFieldId.set("removed-field");
  expect($selectedField.get()).toBeNull();
  expect(
    $visibleFields.get().some((field) => field.id === "removed-field"),
  ).toBe(false);
  expect($visibleDifferences.get()).toEqual([]);
});
