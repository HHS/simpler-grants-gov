import { $selectedFieldId } from "@/stores/fieldComparison";
import {
  $linkNotice,
  $pageTab,
  startFormPage,
  type PageTab,
} from "@/stores/formPage";

/** Apply store state to Astro's existing panels, including reload and Back/Forward. */
export function mountFormPage(root: Document, host: Window): () => void {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[data-tab]")];
  const stop = startFormPage(
    host,
    tabs.map((tab) => tab.dataset.tab!),
  );
  const listeners = tabs.map((tab) => {
    const click = () => $pageTab.set(tab.dataset.tab as PageTab);
    const keydown = (event: KeyboardEvent) => {
      const index = tabs.indexOf(tab);
      let target: HTMLButtonElement | undefined;
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft")
        target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        target.click();
        target.focus();
      }
    };
    tab.addEventListener("click", click);
    tab.addEventListener("keydown", keydown);
    return () => {
      tab.removeEventListener("click", click);
      tab.removeEventListener("keydown", keydown);
    };
  });
  const stopTabs = $pageTab.subscribe((selected) => {
    for (const tab of tabs) {
      const active = tab.dataset.tab === selected;
      tab.classList.toggle("tab-bar__tab--active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of root.querySelectorAll<HTMLElement>("[data-panel]"))
      panel.hidden = panel.dataset.panel !== selected;
  });
  const stopNotice = $linkNotice.subscribe((notice) => {
    const element = root.querySelector<HTMLElement>("[data-link-notice]");
    if (element) {
      element.textContent = notice;
      element.hidden = !notice;
    }
  });
  const staticRows = [
    ...root.querySelectorAll<HTMLElement>("[data-static-field-id]"),
  ];
  const hasComparison = [
    ...root.querySelectorAll<HTMLElement>("[data-panel]"),
  ].some((panel) => panel.dataset.hasComparison === "true");
  const stopStaticField = $selectedFieldId.subscribe((id) => {
    if (hasComparison || !id) return;
    const row = staticRows.find((entry) => entry.dataset.staticFieldId === id);
    if (!row)
      $linkNotice.set("That field no longer exists. Showing the field tree.");
    else {
      if (new URLSearchParams(host.location.search).has("check"))
        $linkNotice.set(
          "Comparisons are not available for this form. Showing the field details.",
        );
      revealField(root, id);
      for (const details of row.querySelectorAll<HTMLDetailsElement>("details"))
        details.open = true;
    }
  });
  return () => {
    stop();
    stopTabs();
    stopNotice();
    stopStaticField();
    listeners.forEach((remove) => remove());
  };
}

/** Reveal a linked row without moving keyboard focus into its Compare control. */
export function revealField(root: Document, id: string) {
  const row = [...root.querySelectorAll<HTMLElement>("[data-field-id]")].find(
    (element) => element.dataset.fieldId === id,
  );
  if (!row) return;
  for (let parent = row.parentElement; parent; parent = parent.parentElement)
    if (parent.tagName === "DETAILS")
      (parent as HTMLDetailsElement).open = true;
  const reduceMotion = root.defaultView?.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  row.scrollIntoView({
    block: "start",
    behavior: reduceMotion ? "instant" : "smooth",
  });
}

/** Keep every SSR store reader on its server snapshot until its actual React commit. */
export function mountFormPageWhenReady(
  root: Document,
  host: Window,
): () => void {
  const boundaries = [
    ...root.querySelectorAll<HTMLElement>("[data-form-state-boundary]"),
  ];
  let stop: (() => void) | undefined;
  let disposed = false;
  const start = () => {
    if (
      disposed ||
      stop ||
      boundaries.some((boundary) => boundary.dataset.formStateReady !== "true")
    )
      return;
    stop = mountFormPage(root, host);
  };
  root.addEventListener("form:state-ready", start);
  start(); // Some islands can commit before the page module arrives.
  return () => {
    disposed = true;
    root.removeEventListener("form:state-ready", start);
    stop?.();
  };
}
