import {
  $categoryFilter,
  $selectedCell,
  $selectedFieldId,
  $sheetTab,
} from "@/stores/fieldComparison";
import { parsePageState, restorePageState } from "@/stores/formPage";
import { JSDOM } from "jsdom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import ReviewLink from "./ReviewLink";

let dom: JSDOM | undefined;
let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  dom?.window.close();
  restorePageState(parsePageState(new URLSearchParams()));
  vi.unstubAllGlobals();
});

it("offers one native anchor with separate field, comparison and finding destinations", () => {
  for (const [props, expected] of [
    [{ field: "key-contacts-country" }, "?field=key-contacts-country"],
    [
      { field: "key-contacts-country", sheet: "comparison" as const },
      "?field=key-contacts-country&tab=comparison",
    ],
    [
      {
        field: "key-contacts-country",
        sheet: "differences" as const,
        check: "plan-vs-dat-help-text",
      },
      "?field=key-contacts-country&tab=findings&check=plan-vs-dat-help-text",
    ],
  ] as const) {
    const document = new JSDOM(renderToStaticMarkup(<ReviewLink {...props} />))
      .window.document;
    expect(document.querySelectorAll("a")).toHaveLength(1);
    expect(document.querySelectorAll("button")).toHaveLength(0);
    expect(document.querySelector("a")!.getAttribute("href")).toBe(expected);
    expect(document.querySelector("a")!.getAttribute("aria-label")).toContain(
      "Link to this",
    );
    document.defaultView!.close();
  }
});

it("ordinary activation selects the tree without a sheet and retains active filters", async () => {
  dom = new JSDOM('<div id="root"></div>', { url: "https://example.test/" });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const { createRoot } = await import("react-dom/client");
  root = createRoot(dom.window.document.getElementById("root")!);
  restorePageState(
    parsePageState(
      new URLSearchParams(
        "field=other&tab=findings&category=gap&check=plan-vs-dat-label",
      ),
    ),
  );
  await act(async () =>
    root!.render(<ReviewLink field="key-contacts-country" />),
  );
  const click = new dom.window.MouseEvent("click", {
    bubbles: true,
    cancelable: true,
  });
  await act(async () =>
    dom!.window.document.querySelector("a")!.dispatchEvent(click),
  );
  expect(click.defaultPrevented).toBe(true);
  expect($selectedFieldId.get()).toBe("key-contacts-country");
  expect($sheetTab.get()).toBeNull();
  expect($selectedCell.get()).toBeNull();
  expect($categoryFilter.get()).toEqual(["gap"]);
});
