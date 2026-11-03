/** React's committed effect, rather than Astro's scheduling event, releases URL restoration. */
export function signalFormStateReady(element: HTMLElement | null): void {
  if (!element) return;
  element.dataset.formStateReady = "true";
  element.dispatchEvent(new Event("form:state-ready", { bubbles: true }));
}
