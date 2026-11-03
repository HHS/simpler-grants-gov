/** A section heading the preview's breadcrumb can name, read from its `data-crumb-*` attributes. */
export interface CrumbAnchor {
  id: string;
  label: string;
  /** 1 for a top-level section, 2 for one inside it, and so on. */
  level: number;
  /** The heading's distance from the top of the viewport. */
  top: number;
}

export type Crumb = Omit<CrumbAnchor, "top">;

/**
 * The sections the reader is inside: of the headings already scrolled past `offset` (the
 * breadcrumb bar's height), the latest at each level, each dropping anything deeper that came
 * before it. Anchors must be in document order.
 */
export function currentTrail(
  anchors: readonly CrumbAnchor[],
  offset: number,
): Crumb[] {
  let trail: Crumb[] = [];
  for (const { top, ...crumb } of anchors) {
    if (top > offset) break;
    trail = [...trail.slice(0, crumb.level - 1), crumb];
  }
  return trail;
}

/** The attributes that make a heading a breadcrumb anchor. */
export const crumbAttributes = (id: string, label: string, level: number) => ({
  id,
  "data-crumb-label": label,
  "data-crumb-level": level,
});

/** A heading tag for a section at `level`, from h3 (the form's own heading is h2) to h6. */
export const headingTag = (level: number) =>
  `h${Math.min(Math.max(level + 2, 3), 6)}` as "h3" | "h4" | "h5" | "h6";

/** A section in the form outline, with the sections inside it. */
export interface OutlineNode extends Crumb {
  children: OutlineNode[];
}

/** The sections, nested by level, from their headings in document order. */
export function outlineTree(crumbs: readonly Crumb[]): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const open: OutlineNode[] = [];
  for (const crumb of crumbs) {
    const node: OutlineNode = { ...crumb, children: [] };
    while (open.length && open[open.length - 1].level >= crumb.level)
      open.pop();
    (open.length ? open[open.length - 1].children : roots).push(node);
    open.push(node);
  }
  return roots;
}
