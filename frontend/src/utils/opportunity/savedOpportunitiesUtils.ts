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
  if (scope.scope === "all") return null;
  if (scope.scope === "individual") return [];
  return scope.organizationIds;
}

/**
 * Get the saved opportunities scope data from URL params. If the params are not
 * valid, will fall back to default scope of "all".
 *
 * Valid scope param combinations
 *  ?scope=individual
 *  ?scope=all
 *  ?scope=organization&organization_id=<uuid>
 *  ?organization_id=<uuid>
 *
 * @param scope all|individual|organization
 * @param organization_id uuid of organization. If this is specified, scope is ignored
 *  and organization scope is assigned.
 */
export function getScopeFromUrlParams(
  scope?: string,
  organization_id?: string,
): SavedOpportunitiesScope {
  if (scope === "individual" || scope === "all") return { scope };
  if (organization_id)
    return { scope: "organization", organizationIds: [organization_id] };
  return DEFAULT_SAVED_OPPORTUNITY_SCOPE;
}
