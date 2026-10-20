import { currentTrail, type Crumb, type CrumbAnchor } from "@/lib/breadcrumbs";
import { useCallback, useEffect, useState, type RefObject } from "react";

/** How far past the bar's bottom a heading must scroll before the bar names it. */
const SLACK = 8;

function readAnchors(container: HTMLElement): CrumbAnchor[] {
  return [...container.querySelectorAll<HTMLElement>("[data-crumb-level]")].map(
    (element) => ({
      id: element.id,
      label: element.dataset.crumbLabel ?? "",
      level: Number(element.dataset.crumbLevel),
      top: element.getBoundingClientRect().top,
    }),
  );
}

const sameCrumbs = (a: readonly Crumb[], b: readonly Crumb[]) =>
  a.length === b.length &&
  a.every((c, i) => c.id === b[i].id && c.label === b[i].label);

/**
 * The form's section headings, and the ones the reader is inside: the headings already
 * scrolled under the sticky `bar`. Also how to scroll a section's heading back to just below
 * the bar.
 */
export function useSectionTrail(
  container: RefObject<HTMLElement | null>,
  bar: RefObject<HTMLElement | null>,
) {
  const [sections, setSections] = useState<Crumb[]>([]);
  const [trail, setTrail] = useState<Crumb[]>([]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = container.current;
      if (!root) return;
      const anchors = readAnchors(root);
      const offset = (bar.current?.getBoundingClientRect().bottom ?? 0) + SLACK;
      const nextSections = anchors.map(({ id, label, level }) => ({
        id,
        label,
        level,
      }));
      const nextTrail = currentTrail(anchors, offset);
      setSections((current) =>
        sameCrumbs(current, nextSections) ? current : nextSections,
      );
      setTrail((current) =>
        sameCrumbs(current, nextTrail) ? current : nextTrail,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Entries added or removed, and sections a rule shows or hides, move the headings.
    const observer = new MutationObserver(schedule);
    if (container.current)
      observer.observe(container.current, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [container, bar]);

  const goTo = useCallback(
    (id: string) => {
      const heading = document.getElementById(id);
      if (!heading) return;
      const barHeight = bar.current?.getBoundingClientRect().height ?? 0;
      window.scrollTo({
        top:
          window.scrollY +
          heading.getBoundingClientRect().top -
          barHeight -
          SLACK +
          1,
        behavior: "smooth",
      });
    },
    [bar],
  );

  return { sections, trail, goTo };
}
