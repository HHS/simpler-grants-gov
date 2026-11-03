import {
  $attributeFilter,
  $categoryFilter,
  $comparison,
  $filterKeys,
  $visibleFields,
  clearCategories,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

import AttributeFilter from "./AttributeFilter";
import DeviationTile from "./DeviationTile";

/** The filter tiles and attribute chips above the field tree, and a way back to every field. */
export default function DeviationTiles() {
  const categories = useStore($categoryFilter);
  const attributes = useStore($attributeFilter);
  const filtering = categories.length > 0 || attributes.length > 0;
  const shown = useStore($visibleFields).length;
  const total = useStore($comparison).fields.length;
  const keys = useStore($filterKeys);
  return (
    <div className="deviation-tiles">
      <div
        className="deviation-tiles__grid"
        role="group"
        aria-label="Filter fields by difference"
      >
        {keys.map((key) => (
          <DeviationTile key={key} filterKey={key} />
        ))}
      </div>
      <AttributeFilter />
      {filtering && (
        <p className="deviation-tiles__clear">
          <button
            type="button"
            className="usa-button--unstyled"
            onClick={clearCategories}
          >
            Clear filter
          </button>{" "}
          · showing {shown} of {total} fields
        </p>
      )}
    </div>
  );
}
