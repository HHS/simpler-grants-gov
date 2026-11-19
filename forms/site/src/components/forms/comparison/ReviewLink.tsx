import {
  $selectedCell,
  $selectedFieldId,
  $sheetTab,
  type SheetTab,
} from "@/stores/fieldComparison";
import { $pageTab, CHECKS } from "@/stores/formPage";

/** A native permalink; ordinary clicks retain current filters through the page stores. */
export default function ReviewLink({
  field,
  check,
  sheet = null,
}: {
  field: string;
  check?: string;
  sheet?: SheetTab | null;
}) {
  const query = new URLSearchParams({ field });
  if (sheet)
    query.set("tab", sheet === "differences" ? "findings" : "comparison");
  if (sheet && check) query.set("check", check);
  const label = sheet ? "Link to this comparison" : "Link to this field";
  return (
    <a
      href={`?${query}`}
      aria-label={label}
      title={label}
      className="review-link"
      onClick={(event) => {
        // Preserve normal new-tab, context-menu and copy-link browser behavior.
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        $pageTab.set("fields");
        $selectedFieldId.set(field);
        $sheetTab.set(sheet);
        $selectedCell.set(sheet && check ? (CHECKS.get(check) ?? null) : null);
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
      </svg>
    </a>
  );
}
