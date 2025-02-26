declare module "@uswds/uswds/js/usa-tooltip" {
  export function on(element: HTMLElement): void;
  export function off(element: HTMLElement): void;
  export function destroy(element: HTMLElement): void;
  export function setContent(element: HTMLElement, content: string): void;
  export function setPosition(element: HTMLElement, position: string): void;
}
