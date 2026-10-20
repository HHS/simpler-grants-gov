import { outlineTree, type Crumb, type OutlineNode } from "@/lib/breadcrumbs";
import { useState, type MouseEvent } from "react";

interface Props {
  sections: Crumb[];
  /** The sections the reader is inside, outermost first. */
  trail: Crumb[];
  goTo: (id: string) => void;
}

/**
 * The form's sections beside it, ported from the frontend's `LeftHandFormNav` (the USWDS
 * in-page navigation on the apply form). That one lists only the top-level sections; this one
 * nests each section's own under it, marks the sections the reader is in, and lets any section
 * with sections of its own collapse. The ones the reader is in open by themselves until toggled.
 */
export default function FormOutline({ sections, trail, goTo }: Props) {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  if (!sections.length) return null;
  const inside = new Set(trail.map((crumb) => crumb.id));
  const current = trail.at(-1)?.id;
  const isOpen = (id: string) => toggled[id] ?? inside.has(id);

  const link = (node: OutlineNode) => (
    <a
      className={`usa-link usa-in-page-nav__link${node.id === current ? " usa-current" : ""}${inside.has(node.id) ? " form-outline__link--inside" : ""}`}
      href={`#${node.id}`}
      aria-current={node.id === current ? "location" : undefined}
      onClick={(event: MouseEvent) => {
        event.preventDefault();
        goTo(node.id);
      }}
    >
      {node.label}
    </a>
  );

  // Every row leads with a caret, or the caret's space, so titles at one depth line up.
  const list = (nodes: OutlineNode[], sub: boolean) => (
    <ul
      className={`usa-in-page-nav__list${sub ? " form-outline__sublist" : ""}`}
    >
      {nodes.map((node) => {
        const collapsible = node.children.length > 0;
        const open = !collapsible || isOpen(node.id);
        const listId = `${node.id}-outline`;
        return (
          <li
            key={node.id}
            className={`usa-in-page-nav__item${sub ? " usa-in-page-nav__item--sub" : ""}`}
          >
            <div
              className={`form-outline__row${collapsible ? "" : " form-outline__row--leaf"}`}
            >
              {collapsible && (
                <button
                  type="button"
                  className="form-outline__toggle"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-label={`${open ? "Hide" : "Show"} the sections in ${node.label}`}
                  onClick={() =>
                    setToggled((all) => ({ ...all, [node.id]: !open }))
                  }
                >
                  <span className="form-outline__caret" aria-hidden="true" />
                </button>
              )}
              {link(node)}
            </div>
            {collapsible && (
              <div id={listId} hidden={!open}>
                {list(node.children, true)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className="usa-in-page-nav form-outline order-1 margin-left-0"
      aria-label="Sections in this form"
    >
      <nav className="usa-in-page-nav__nav padding-x-0">
        <h4 className="usa-in-page-nav__heading">Sections in this form</h4>
        {list(outlineTree(sections), false)}
      </nav>
    </aside>
  );
}
