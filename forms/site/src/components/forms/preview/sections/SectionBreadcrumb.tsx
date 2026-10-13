import type { Crumb } from "@/lib/breadcrumbs";
import type { RefObject } from "react";

/**
 * A bar that sticks to the top of the window while the form scrolls beneath it, naming the
 * sections the reader is inside, e.g. "Key Contacts › Key Contacts 1 › Name". Each crumb
 * scrolls back to its section's heading.
 */
export default function SectionBreadcrumb({
  ref,
  trail,
  goTo,
}: {
  ref: RefObject<HTMLElement | null>;
  trail: Crumb[];
  goTo: (id: string) => void;
}) {
  return (
    <nav
      ref={ref}
      className="section-breadcrumb"
      aria-label="Where you are in the form"
    >
      {trail.length === 0 ? (
        <span className="section-breadcrumb__top">Top of form</span>
      ) : (
        <ol className="section-breadcrumb__list">
          {trail.map((crumb, index) => {
            const current = index === trail.length - 1;
            return (
              <li key={crumb.id} className="section-breadcrumb__item">
                <button
                  type="button"
                  className={`section-breadcrumb__crumb${current ? " section-breadcrumb__crumb--current" : ""}`}
                  aria-current={current ? "location" : undefined}
                  onClick={() => goTo(crumb.id)}
                >
                  {crumb.label}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
