/**
 * URL restoration must wait until every React reader of the shared stores has
 * committed; Astro's hydration scheduling event can arrive before that commit.
 * Each island calls this from its effect, and the page adapter waits for all
 * boundaries. The shared signal lives here; state stays in the nanostores.
 */
export function signalFormStateReady(element: HTMLElement | null): void {
  if (!element) return;
  element.dataset.formStateReady = "true";
  element.dispatchEvent(new Event("form:state-ready", { bubbles: true }));
}
