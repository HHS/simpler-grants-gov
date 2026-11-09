import { readFile } from "node:fs/promises";
import FieldComparison from "@/components/forms/comparison/FieldComparison";
import type { FieldNode } from "@/content.config";
import { $categoryFilter, $comparison } from "@/stores/fieldComparison";
import { parsePageState, restorePageState } from "@/stores/formPage";
import { compareForm } from "@parity/comparison.ts";
import { JSDOM } from "jsdom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { mountFormPageWhenReady } from "./formPage";

let dom: JSDOM | undefined;
const roots: Root[] = [];
let stop: (() => void) | undefined;
afterEach(async () => {
  stop?.();
  stop = undefined;
  await act(async () => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  restorePageState(parsePageState(new URLSearchParams()));
  $comparison.set({ children: [], fields: [] });
  dom?.window.close();
  dom = undefined;
  vi.unstubAllGlobals();
});

it("keeps server snapshots until every real React island commits, then restores URL filters", async () => {
  const plan = JSON.parse(
    await readFile(
      new URL("../content/forms/epa-key-contacts-form.json", import.meta.url),
      "utf8",
    ),
  );
  const comparison = (await compareForm<FieldNode>(plan))!;
  const node = <FieldComparison comparison={comparison} />;
  const html = renderToString(node);
  // Two real instances exercise separate island commits; no component or store hook is mocked.
  dom = new JSDOM(
    `<button data-tab="fields">Fields</button><div data-panel="fields" data-has-comparison="true"><div id="one">${html}</div><div id="two">${html}</div></div><p data-link-notice hidden></p>`,
    {
      url: "https://example.test/forms/epa-key-contacts-form/?category=gap",
      pretendToBeVisual: true,
    },
  );
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("navigator", dom.window.navigator);
  vi.stubGlobal("Node", dom.window.Node);
  vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
  vi.stubGlobal("HTMLDialogElement", dom.window.HTMLDialogElement);
  vi.stubGlobal("Event", dom.window.Event);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const doc = dom.window.document;
  const one = doc.getElementById("one")!;
  const two = doc.getElementById("two")!;
  expect(one.querySelectorAll("[data-field-id]").length).toBe(
    comparison.fields.length,
  );
  expect(comparison.fields.length).toBeGreaterThan(0);
  stop = mountFormPageWhenReady(doc, dom.window as unknown as Window);
  // The page module may start before either React root; it must not change the SSR snapshot.
  const errors: unknown[] = [];
  const { hydrateRoot } = await import("react-dom/client");
  await act(async () => {
    roots.push(
      hydrateRoot(one, node, {
        onRecoverableError: (error) => errors.push(error),
      }),
    );
  });
  expect(errors).toEqual([]);
  expect($categoryFilter.get()).toEqual([]);
  expect(two.querySelectorAll("[data-field-id]").length).toBe(
    comparison.fields.length,
  );
  await act(async () => {
    roots.push(
      hydrateRoot(two, node, {
        onRecoverableError: (error) => errors.push(error),
      }),
    );
  });
  expect(errors).toEqual([]);
  expect($categoryFilter.get()).toEqual(["gap"]);
  expect(one.querySelectorAll("[data-field-id]")).toHaveLength(0);
  expect(two.querySelectorAll("[data-field-id]")).toHaveLength(0);
  expect(dom.window.location.search).toBe("?category=gap");
});
