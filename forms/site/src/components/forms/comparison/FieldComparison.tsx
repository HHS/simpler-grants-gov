import { differences, type FormComparison } from "@/lib/comparison";
import { signalFormStateReady } from "@/lib/formHydration";
import { revealField } from "@/lib/formPage";
import {
  $comparison,
  $selectedCell,
  $selectedFieldId,
  $sheetTab,
} from "@/stores/fieldComparison";
import { $linkNotice, $pageTab } from "@/stores/formPage";
import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";

import ComparisonSheet from "./ComparisonSheet";
import DeviationTiles from "./DeviationTiles";
import FieldTree from "./FieldTree";

/**
 * The field tree with each field compared against the DAT, XSD and compiled form. The only
 * component that sets state from props; everything below reads the stores.
 */
export default function FieldComparison({
  comparison,
}: {
  comparison: FormComparison;
}) {
  // Set before the first render, so the server-rendered tree is not empty.
  useState(() => $comparison.set(comparison));
  const selected = useStore($selectedFieldId);
  const cell = useStore($selectedCell);
  const sheet = useStore($sheetTab);
  const pageTab = useStore($pageTab);
  const boundary = useRef<HTMLDivElement>(null);
  useEffect(() => signalFormStateReady(boundary.current), []);
  useEffect(() => {
    if (!selected) return;
    const field = comparison.fields.find((item) => item.field.id === selected);
    if (field && !sheet && pageTab === "fields")
      revealField(document, selected);
    if (!field)
      $linkNotice.set("That field no longer exists. Showing the field tree.");
    else if (
      cell &&
      !field.rows.some((row) => row.attribute === cell.attribute)
    )
      $linkNotice.set("That comparison no longer exists. Showing the field.");
    else if (
      cell &&
      sheet === "differences" &&
      !differences(field).some(
        (entry) =>
          entry.attribute === cell.attribute && entry.source === cell.source,
      )
    )
      $linkNotice.set(
        "That finding no longer exists. Showing the field’s differences.",
      );
  }, [comparison, selected, cell, sheet, pageTab]);
  return (
    <div ref={boundary} data-form-state-boundary>
      <DeviationTiles />
      <FieldTree />
      <ComparisonSheet />
    </div>
  );
}
