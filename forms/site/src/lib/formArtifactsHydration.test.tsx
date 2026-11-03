import FormArtifactsPanel from "@/components/forms/FormArtifactsPanel";
import { $schemaFile, $sourceFile } from "@/stores/formArtifacts";
import { JSDOM } from "jsdom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { loadFormSpec } from "./formSpec";
import { highlight } from "./highlight";

let dom: JSDOM | undefined;
let root: Root | undefined;
let stop: (() => void) | undefined;

afterEach(async () => {
  stop?.();
  stop = undefined;
  if (root) await act(async () => root!.unmount());
  root = undefined;
  $schemaFile.set("schema.json");
  $sourceFile.set("index.tsp");
  dom?.window.close();
  dom = undefined;
  vi.unstubAllGlobals();
});

it.each([
  ["schemas", "schema.json", "ui.json"],
  ["source", "index.tsp", "form.tsp"],
] as const)(
  "%s panels preserve SSR until React commits, then allow linked-file restoration",
  async (kind, initialName, linkedName) => {
    const spec = await loadFormSpec("epa-key-contacts");
    const files = kind === "schemas" ? spec.schemas : spec.sources;
    const selection = kind === "schemas" ? $schemaFile : $sourceFile;
    selection.set(initialName);
    // The real highlighter is loaded, not mocked; its later async render stays in act.
    const linkedFile = files.find((file) => file.name === linkedName)!;
    await highlight(linkedFile.code, linkedFile.lang);
    const node = <FormArtifactsPanel kind={kind} files={files} />;
    const html = renderToString(node);
    dom = new JSDOM(`<div id="island">${html}</div>`, {
      url: `https://example.test/forms/epa-key-contacts-form/?tab=${kind}&${kind === "schemas" ? "schema" : "source"}=${linkedName}`,
    });
    vi.stubGlobal("window", dom.window);
    vi.stubGlobal("document", dom.window.document);
    vi.stubGlobal("navigator", dom.window.navigator);
    vi.stubGlobal("Event", dom.window.Event);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const doc = dom.window.document;
    const container = doc.getElementById("island")!;
    const boundary = container.querySelector<HTMLElement>(
      "[data-form-state-boundary]",
    )!;
    expect(boundary.dataset.formStateReady).toBeUndefined();
    const selectedName = () =>
      container.querySelector(".form-artifacts__tools code")!.textContent;
    expect(selectedName()).toBe(initialName);

    const committed: string[] = [];
    const restoreLinkedFile = () => {
      expect(boundary.dataset.formStateReady).toBe("true");
      committed.push(selectedName()!);
      selection.set(linkedName);
    };
    doc.addEventListener("form:state-ready", restoreLinkedFile);
    stop = () => doc.removeEventListener("form:state-ready", restoreLinkedFile);
    const errors: unknown[] = [];
    const { hydrateRoot } = await import("react-dom/client");
    await act(async () => {
      root = hydrateRoot(container, node, {
        onRecoverableError: (error) => errors.push(error),
      });
      // hydrateRoot schedules work; a scheduling event must not release URL state.
      expect(committed).toEqual([]);
      expect(selection.get()).toBe(initialName);
    });
    expect(committed).toEqual([initialName]);
    expect(errors).toEqual([]);
    expect(selection.get()).toBe(linkedName);
    expect(selectedName()).toBe(linkedName);
    expect(
      container.querySelector("a[download]")!.getAttribute("download"),
    ).toBe(linkedName);
  },
);
