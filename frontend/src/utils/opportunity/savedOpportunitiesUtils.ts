import { SavedOpportunitiesScope } from "src/types/opportunity/savedOpportunitiesTypes";

export const INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE: SavedOpportunitiesScope = {
  scope: "individual",
};

export const ALL_SAVED_OPPORTUNITY_SCOPE: SavedOpportunitiesScope = {
  scope: "all",
};

export const DEFAULT_SAVED_OPPORTUNITY_SCOPE: SavedOpportunitiesScope =
  ALL_SAVED_OPPORTUNITY_SCOPE;

export function getSavedOpportunitiesScopeOrganizationIds(
  scope: SavedOpportunitiesScope,
): string[] | null {
  if (scope.scope === "all") {
    return null;
  }

  if (scope.scope === "individual") {
    return [];
  }

  return scope.organizationIds;
}

/**
 * Get the saved opportunities scope data from URL params. If the params are not
 * valid, will fall back to default scope of "all".
 *
 * Supported URL shapes:
 * - ?scope=individual
 * - ?scope=all
 * - ?scope=organization&organization_id=<uuid>
 * - ?organization_id=<uuid>
 * - ?savedBy=individual
 * - ?savedBy=all
 * - ?savedBy=organization:<uuid>
 *
 * If both legacy params and savedBy are provided, savedBy takes precedence.
 */
export function getScopeFromUrlParams(
  scope?: string,
  organizationId?: string,
  savedBy?: string | null,
): SavedOpportunitiesScope {
  if (savedBy === "individual") {
    return INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE;
  }

  if (savedBy?.startsWith("organization:")) {
    return {
      scope: "organization",
      organizationIds: [savedBy.replace("organization:", "")],
    };
  }

  if (savedBy === "all") {
    return DEFAULT_SAVED_OPPORTUNITY_SCOPE;
  }

  if (scope === "individual" || scope === "all") {
    return { scope };
  }

  if (organizationId) {
    return { scope: "organization", organizationIds: [organizationId] };
  }

  return DEFAULT_SAVED_OPPORTUNITY_SCOPE;
}
