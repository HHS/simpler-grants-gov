import {
  $selectedField,
  $sheetTab,
  $summary,
  closeSheet,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";

import CellDetail from "./CellDetail";
import DifferenceList from "./DifferenceList";
import SheetTabs from "./SheetTabs";
import StatusMatrix from "./StatusMatrix";

/**
 * A modal sheet comparing one field with its sources: from the right on wide screens, from
 * the bottom on phones. `showModal` gives it focus trapping and Escape for free.
 */
export default function ComparisonSheet() {
  const field = useStore($selectedField);
  const tab = useStore($sheetTab);
  const summary = useStore($summary);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (field && !element.open) element.showModal();
    if (!field && element.open) element.close();
  }, [field]);

  return (
    <dialog
      ref={dialog}
      className="comparison-sheet"
      aria-labelledby="comparison-sheet-title"
      onClose={closeSheet}
      // A click on the dialog itself, not its contents, is a click on the scrim.
      onClick={(event) => event.target === event.currentTarget && closeSheet()}
    >
      {field && (
        <div className="comparison-sheet__body">
          <header className="comparison-sheet__header">
            <div>
              <h2
                id="comparison-sheet-title"
                className="comparison-sheet__title"
              >
                {field.field.label}
              </h2>
              <p className="comparison-sheet__summary">{summary}</p>
            </div>
            <button
              type="button"
              className="comparison-sheet__close"
              aria-label="Close comparison"
              onClick={closeSheet}
            >
              ×
            </button>
          </header>
          <SheetTabs />
          <div
            id="sheet-panel"
            role="tabpanel"
            aria-labelledby={`sheet-tab-${tab}`}
            className="comparison-sheet__panel"
          >
            {tab === "comparison" ? (
              <>
                <StatusMatrix field={field} />
                <CellDetail />
              </>
            ) : (
              <DifferenceList />
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
