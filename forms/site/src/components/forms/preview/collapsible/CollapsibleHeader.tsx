import { crumbAttributes, headingTag } from "@/lib/breadcrumbs";
import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  /** What the breadcrumb calls this section. */
  label: string;
  /** The section's depth, which sets its heading level. */
  level: number;
  headingId: string;
  collapsed: boolean;
  onToggle: () => void;
  /** Errors in the section's fields, shown while it is collapsed. */
  errorCount?: number;
  /** Further actions after Edit/Collapse, e.g. a list entry's Delete. */
  actions?: ReactNode;
}

/**
 * A collapsible section's header: a heading whose button toggles the section, and Edit or
 * Collapse. The heading is a breadcrumb anchor, like any other section's.
 */
export default function CollapsibleHeader({
  title,
  label,
  level,
  headingId,
  collapsed,
  onToggle,
  errorCount = 0,
  actions,
}: Props) {
  const Heading = headingTag(level);
  return (
    <div className="collapsible__header">
      <Heading
        className={`collapsible__heading form-section__heading--${level}`}
        {...crumbAttributes(headingId, label, level)}
      >
        <button
          type="button"
          className="collapsible__toggle"
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <span className="collapsible__caret" aria-hidden="true" />
          {title}
        </button>
      </Heading>
      {collapsed && errorCount > 0 && (
        <span className="collapsible__errors">
          {errorCount} {errorCount === 1 ? "error" : "errors"}
        </span>
      )}
      <button
        type="button"
        className="usa-button usa-button--unstyled collapsible__action"
        onClick={onToggle}
      >
        {collapsed ? "Edit" : "Collapse"}
      </button>
      {actions}
    </div>
  );
}
