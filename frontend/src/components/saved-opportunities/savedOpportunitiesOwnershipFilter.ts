/**
 * Represents the ownership scope for saved opportunities in the UI.
 *
 * We explicitly model this as a discriminated union instead of using raw
 * API values (null, [], [id]) because:
 * - The API semantics are not intuitive
 * - This keeps UI logic readable and type-safe
 * - Mapping to API happens in one place (see getOrganizationIdsFilter)
 */
export type SavedOpportunitiesOwnershipFilter =
  | { kind: "all" } // Show both individual + organization saved opportunities
  | { kind: "individual" } // Only opportunities saved by the current user
  | { kind: "organization"; organizationId: string }; // Only opportunities saved by a specific organization

/**
 * Parses a string value (typically from URL search params or a select input)
 * into the internal ownership filter model.
 *
 * Supported values:
 * - "all" (or null/undefined) -> { kind: "all" }
 * - "individual" -> { kind: "individual" }
 * - "organization:<id>" -> { kind: "organization", organizationId }
 *
 * We default to "all" to match the product requirement that the page loads
 * with all saved opportunities visible.
 */
export function parseOwnershipFilterValue(
  value: string | null | undefined,
): SavedOpportunitiesOwnershipFilter {
  if (value === "individual") {
    return { kind: "individual" };
  }

  if (value?.startsWith("organization:")) {
    return {
      kind: "organization",
      organizationId: value.replace("organization:", ""),
    };
  }

  return { kind: "all" };
}

/**
 * Converts the internal ownership filter model into a string value
 * that can be used in UI controls (e.g., <select>) or URL params.
 *
 * This ensures a consistent encoding/decoding pattern between UI state
 * and URL/search params.
 */
export function getOwnershipFilterValue(
  filter: SavedOpportunitiesOwnershipFilter,
): string {
  switch (filter.kind) {
    case "all":
      return "all";
    case "individual":
      return "individual";
    case "organization":
      return `organization:${filter.organizationId}`;
  }
}

/**
 * Maps the internal ownership filter model to the backend API's
 * `organization_ids` parameter.
 *
 * IMPORTANT: The API uses non-intuitive semantics:
 *
 * - null -> "Show all"
 *   Includes both:
 *     - individually saved opportunities
 *     - organization saved opportunities
 *
 * - [] (empty array) -> "Individual only"
 *   This explicitly excludes organization-saved opportunities.
 *
 * - ["org-id"] -> "Specific organization only"
 *   Only returns opportunities saved to that organization.
 *
 * We isolate this mapping here so the rest of the UI never needs to
 * reason about these special cases.
 */
export function getOrganizationIdsFilter(
  filter: SavedOpportunitiesOwnershipFilter,
): string[] | null {
  switch (filter.kind) {
    case "all":
      return null;
    case "individual":
      return [];
    case "organization":
      return [filter.organizationId];
  }
}
