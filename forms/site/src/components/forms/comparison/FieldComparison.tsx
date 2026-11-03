import type { FormComparison } from "@/lib/comparison";
import { $comparison } from "@/stores/fieldComparison";
import { useState } from "react";

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
  return (
    <>
      <DeviationTiles />
      <FieldTree />
      <ComparisonSheet />
    </>
  );
}
