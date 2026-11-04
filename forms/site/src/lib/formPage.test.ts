import type { FieldComparison } from "@/lib/comparison";
import {
  $attributeFilter,
  $categoryFilter,
  $comparison,
  $selectedCell,
  $selectedField,
  $selectedFieldId,
  $sheetTab,
  openField,
  selectCell,
} from "@/stores/fieldComparison";
import { $schemaFile, $sourceFile } from "@/stores/formArtifacts";
import {
  $linkNotice,
  $pageTab,
  CHECKS,
  checkSlug,
  currentPageState,
  pageUrl,
  parsePageState,
  restorePageState,
  startFormPage,
} from "@/stores/formPage";
import { $dataView } from "@/stores/formPreview";
import { afterEach, describe, expect, it } from "vitest";

import { signalFormStateReady } from "./formHydration";
// DOM-shaped targets exercise the actual adapter, not a browser/dialog/clipboard walkthrough.
import { mountFormPage, mountFormPageWhenReady, revealField } from "./formPage";

class Page extends EventTarget {
  url: URL;
  entries: string[];
  index = 0;
  writes: string[] = [];
  constructor(query = "") {
    super();
    this.url = new URL(`https://example.test/forms/key-contacts/${query}`);
    this.entries = [this.url.href];
  }
  get location() {
    return this.url;
  }
  history = {
    pushState: (
      _state: unknown,
      _unused: string,
      url?: string | URL | null,
    ) => {
      this.url = new URL(String(url), this.url);
      this.entries = this.entries.slice(0, this.index + 1);
      this.entries.push(this.url.href);
      this.index++;
      this.writes.push("push");
    },
    replaceState: (
      _state: unknown,
      _unused: string,
      url?: string | URL | null,
    ) => {
      this.url = new URL(String(url), this.url);
      this.entries[this.index] = this.url.href;
      this.writes.push("replace");
    },
  };
  go(delta: number) {
    this.index += delta;
    this.url = new URL(this.entries[this.index]);
    this.dispatchEvent(new Event("popstate"));
  }
  host() {
    return this as unknown as Window;
  }
}
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
  restorePageState(parsePageState(new URLSearchParams()));
  $comparison.set({ children: [], fields: [] });
});

describe("form page links", () => {
  it("parses only supported filters/views and uses fixed comparison slugs", () => {
    const state = parsePageState(
      new URLSearchParams(
        "tab=findings&field=first-name&check=plan-vs-dat-help-text&category=gap&category=gap&category=typo&attribute=help&data=xml",
      ),
    );
    expect(state).toMatchObject({
      tab: "fields",
      field: "first-name",
      sheet: "differences",
      data: "xml",
      categories: ["gap"],
      attributes: ["help"],
    });
    expect(CHECKS.get(state.check!)).toEqual({
      attribute: "help",
      source: "dat",
    });
    expect(new Set(CHECKS.keys()).size).toBe(30);
    for (const [slug, cell] of CHECKS) expect(checkSlug(cell)).toBe(slug);
  });

  it("keeps a field-tree permalink distinct from a comparison permalink", () => {
    const field = parsePageState(
      new URLSearchParams("field=key-contacts-country"),
    );
    expect(field.sheet).toBeNull();
    expect(
      pageUrl(new URL("https://example.test/forms/key-contacts/"), field),
    ).toBe("/forms/key-contacts/?field=key-contacts-country");
    const comparison = parsePageState(
      new URLSearchParams("tab=comparison&field=key-contacts-country"),
    );
    expect(comparison.sheet).toBe("comparison");
    expect(
      pageUrl(new URL("https://example.test/forms/key-contacts/"), comparison),
    ).toContain("tab=comparison");
  });

  it("Back skips comparisons within one field but returns to the previous field", async () => {
    const page = new Page();
    stop = startFormPage(page.host(), ["fields", "data"]);
    openField("one");
    await flush();
    selectCell({ attribute: "help", source: "dat" });
    await flush();
    selectCell({ attribute: "label", source: "xsd" });
    await flush();
    openField("two");
    await flush();
    selectCell({ attribute: "format", source: "form" });
    await flush();
    expect(page.writes).toEqual([
      "push",
      "replace",
      "replace",
      "push",
      "replace",
    ]);
    page.go(-1);
    await flush();
    expect($selectedFieldId.get()).toBe("one");
    expect($selectedCell.get()).toEqual({ attribute: "label", source: "xsd" });
    expect(page.entries).toHaveLength(3);
  });

  it("opens a link into the actual existing comparison, filter, Data and artifact stores", () => {
    const page = new Page(
      "?tab=findings&field=applicant-name&check=plan-vs-dat-help-text&category=intentional&attribute=help&data=xml&schema=ui.json&source=form.tsp",
    );
    stop = startFormPage(page.host(), ["fields", "data"]);
    expect($selectedFieldId.get()).toBe("applicant-name");
    expect($selectedCell.get()).toEqual({ attribute: "help", source: "dat" });
    expect($sheetTab.get()).toBe("differences");
    expect($categoryFilter.get()).toEqual(["intentional"]);
    expect($attributeFilter.get()).toEqual(["help"]);
    expect($dataView.get()).toBe("xml");
    expect($schemaFile.get()).toBe("ui.json");
    expect($sourceFile.get()).toBe("form.tsp");
    expect(page.writes).toEqual([]);
  });

  it("batches a field's reset/open into one push, and small changes replace it", async () => {
    const page = new Page("?review=keep");
    stop = startFormPage(page.host(), ["fields", "data"]);
    openField("applicant-name");
    await flush();
    expect(page.writes).toEqual(["push"]);
    expect(page.location.searchParams.get("field")).toBe("applicant-name");
    $categoryFilter.set(["gap"]);
    $dataView.set("xml");
    $schemaFile.set("ui.json");
    await flush();
    expect(page.writes).toEqual(["push", "replace"]);
    expect(page.location.searchParams.get("review")).toBe("keep");
    selectCell({ attribute: "help", source: "dat" });
    await flush();
    expect(page.writes).toEqual(["push", "replace", "replace"]);
    expect(page.location.searchParams.get("check")).toBe(
      "plan-vs-dat-help-text",
    );
  });

  it("Back and Forward restore stores without feedback entries, including bare defaults", async () => {
    const page = new Page();
    stop = startFormPage(page.host(), ["fields", "data"]);
    openField("name");
    await flush();
    $pageTab.set("data");
    $dataView.set("xml");
    await flush();
    expect(page.entries).toHaveLength(3);
    page.go(-1);
    await flush();
    expect($pageTab.get()).toBe("fields");
    expect($dataView.get()).toBe("json");
    expect($selectedFieldId.get()).toBe("name");
    page.go(-1);
    await flush();
    expect($selectedFieldId.get()).toBeNull();
    page.go(1);
    await flush();
    expect($selectedFieldId.get()).toBe("name");
    expect(page.writes).toEqual(["push", "push"]);
  });

  it("a pending interaction cannot overwrite a later popstate entry", async () => {
    const page = new Page();
    stop = startFormPage(page.host(), ["fields", "data"]);
    openField("one");
    await flush();
    openField("two");
    page.go(-1);
    await flush();
    expect($selectedFieldId.get()).toBeNull();
    expect(page.writes).toEqual(["push"]);
  });

  it("unavailable tabs and removed comparisons show a notice without crashing", () => {
    const page = new Page("?tab=schemas&field=name&check=removed");
    stop = startFormPage(page.host(), ["fields"]);
    expect($pageTab.get()).toBe("fields");
    expect($selectedFieldId.get()).toBe("name");
    expect($selectedCell.get()).toBeNull();
    expect($linkNotice.get()).toContain("not available");
    expect($linkNotice.get()).toContain("comparison no longer exists");
  });

  it("uses a persisted ID after labels, JSON paths and tree positions change", () => {
    const field = {
      id: "applicant-name",
      field: {
        id: "applicant-name",
        label: "Name",
        json_path: "applicant.name",
      },
      rows: [],
      counts: { gap: 0, upstream: 0, intentional: 0 },
    } as unknown as FieldComparison;
    const page = new Page("?field=applicant-name");
    stop = startFormPage(page.host(), ["fields"]);
    const renamed = structuredClone(field);
    renamed.field.label = "Renamed person";
    renamed.field.json_path = "organization.person.full_name";
    $comparison.set({
      fields: [renamed],
      children: [
        {
          kind: "section",
          section: { kind: "section", label: "New group" },
          children: [{ kind: "field", id: renamed.id }],
        },
      ],
    });
    expect($selectedField.get()).toBe(renamed);
    expect(pageUrl(new URL(page.location), currentPageState())).toContain(
      "field=applicant-name",
    );
    expect(pageUrl(new URL(page.location), currentPageState())).not.toContain(
      "organization",
    );
  });

  it("stops subscriptions and popstate listeners on disposal", async () => {
    const page = new Page();
    const dispose = startFormPage(page.host(), ["fields"]);
    dispose();
    openField("later");
    await flush();
    expect(page.writes).toEqual([]);
    page.url = new URL("https://example.test/forms/a/?field=ignored");
    page.dispatchEvent(new Event("popstate"));
    expect($selectedFieldId.get()).toBe("later");
  });
});

class Element extends EventTarget {
  dataset: Record<string, string>;
  hidden = false;
  tabIndex = -1;
  parentElement: Element | null = null;
  tagName = "DIV";
  open = false;
  textContent = "";
  attributes = new Map<string, string>();
  classes = new Set<string>();
  focused = false;
  scrolled = false;
  target: Element | null = null;
  classList = {
    toggle: (name: string, on: boolean) =>
      on ? this.classes.add(name) : this.classes.delete(name),
  };
  constructor(dataset: Record<string, string> = {}) {
    super();
    this.dataset = dataset;
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  focus() {
    this.focused = true;
  }
  scrollIntoView() {
    this.scrolled = true;
  }
  click() {
    this.dispatchEvent(new Event("click"));
  }
  querySelector() {
    return this.target;
  }
  querySelectorAll() {
    return [];
  }
}
function documentFor(
  tabs: Element[],
  panels: Element[],
  notice: Element,
  rows: Element[] = [],
  boundaries: Element[] = [],
) {
  return Object.assign(new EventTarget(), {
    querySelectorAll: (selector: string) =>
      selector === "[data-tab]"
        ? tabs
        : selector === "[data-panel]"
          ? panels
          : selector === "[data-field-id]"
            ? rows
            : selector === "[data-static-field-id]"
              ? rows.filter((row) => row.dataset.staticFieldId)
              : selector === "[data-form-state-boundary]"
                ? boundaries
                : [],
    querySelector: () => notice,
  }) as unknown as Document;
}
describe("the rendered panel adapter", () => {
  it("does not invent a comparison on a static plan-only field link", () => {
    const page = new Page("?field=name&check=plan-vs-dat-help-text");
    const row = new Element({ fieldId: "name", staticFieldId: "name" });
    const notice = new Element();
    stop = mountFormPage(documentFor([], [], notice, [row]), page.host());
    expect(row.scrolled).toBe(true);
    expect(row.focused).toBe(true);
    expect(notice.textContent).toContain("Comparisons are not available");
  });

  it("shows a stale-field notice on a catalog record with no plan or comparison", () => {
    const page = new Page("?field=removed&check=plan-vs-dat-help-text");
    const notice = new Element();
    stop = mountFormPage(documentFor([], [], notice), page.host());
    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toContain("field no longer exists");
  });

  it("restores a linked panel and Back/Forward into visible panels and ARIA tab state", async () => {
    const page = new Page("?tab=data");
    const tabs = [new Element({ tab: "fields" }), new Element({ tab: "data" })];
    const panels = [
      new Element({ panel: "fields" }),
      new Element({ panel: "data" }),
    ];
    const notice = new Element();
    stop = mountFormPage(documentFor(tabs, panels, notice), page.host());
    expect(panels.map((panel) => panel.hidden)).toEqual([true, false]);
    expect(tabs[1].attributes.get("aria-selected")).toBe("true");
    expect(tabs[1].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);
    tabs[0].click();
    await flush();
    expect(panels.map((panel) => panel.hidden)).toEqual([false, true]);
    page.go(-1);
    await flush();
    expect(panels.map((panel) => panel.hidden)).toEqual([true, false]);
    expect(page.writes).toEqual(["push"]);
  });
  it("keeps roving tabs reachable by arrow keys and exposes stale-link notices", async () => {
    const page = new Page("?tab=removed");
    const tabs = [new Element({ tab: "fields" }), new Element({ tab: "data" })];
    const notice = new Element();
    stop = mountFormPage(documentFor(tabs, [], notice), page.host());
    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toContain("no longer exists");
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperty(event, "key", { value: "ArrowRight" });
    tabs[0].dispatchEvent(event);
    await flush();
    expect($pageTab.get()).toBe("data");
    expect(tabs[1].focused).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(notice.hidden).toBe(true);
  });
  it("reveals the selected stable plan row through collapsed ancestor groups", () => {
    const row = new Element({ fieldId: "first-name" });
    const group = new Element();
    group.tagName = "DETAILS";
    row.parentElement = group;
    const compare = new Element();
    row.target = compare;
    revealField(documentFor([], [], new Element(), [row]), "first-name");
    expect(group.open).toBe(true);
    expect(row.scrolled).toBe(true);
    expect(compare.focused).toBe(true);
  });
});

describe("URL restoration after React commit", () => {
  it("waits for all SSR state boundaries before applying linked stores", () => {
    const page = new Page("?tab=data&source=form.tsp&category=gap");
    const fields = new Element({ tab: "fields" });
    const data = new Element({ tab: "data" });
    const comparison = new Element();
    const source = new Element();
    const doc = documentFor(
      [fields, data],
      [],
      new Element(),
      [],
      [comparison, source],
    );
    stop = mountFormPageWhenReady(doc, page.host());
    expect($pageTab.get()).toBe("fields");
    expect($sourceFile.get()).toBe("index.tsp");
    expect($categoryFilter.get()).toEqual([]);
    signalFormStateReady(comparison as unknown as HTMLElement);
    // EventTarget test doubles do not have DOM ancestry/bubbling.
    doc.dispatchEvent(new Event("form:state-ready"));
    expect($sourceFile.get()).toBe("index.tsp");
    signalFormStateReady(source as unknown as HTMLElement);
    doc.dispatchEvent(new Event("form:state-ready"));
    expect($pageTab.get()).toBe("data");
    expect($sourceFile.get()).toBe("form.tsp");
    expect($categoryFilter.get()).toEqual(["gap"]);
    expect(page.writes).toEqual([]);
  });

  it("handles boundaries committed before page startup and cleans up pending startup", () => {
    const ready = new Element();
    let bubbles = false;
    ready.addEventListener("form:state-ready", (event) => {
      bubbles = event.bubbles;
    });
    signalFormStateReady(ready as unknown as HTMLElement);
    expect(bubbles).toBe(true);
    const page = new Page("?tab=data");
    const tabs = [new Element({ tab: "fields" }), new Element({ tab: "data" })];
    stop = mountFormPageWhenReady(
      documentFor(tabs, [], new Element(), [], [ready]),
      page.host(),
    );
    expect($pageTab.get()).toBe("data");
    stop();
    stop = undefined;
    restorePageState(parsePageState(new URLSearchParams()));
    const pending = new Element();
    const doc = documentFor(tabs, [], new Element(), [], [pending]);
    const dispose = mountFormPageWhenReady(doc, page.host());
    dispose();
    signalFormStateReady(pending as unknown as HTMLElement);
    doc.dispatchEvent(new Event("form:state-ready"));
    expect($pageTab.get()).toBe("fields");
  });
});
