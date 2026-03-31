import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

export interface SavedOpportunityTag {
  key: string;
  label: string;
  screenReaderLabel: string;
  kind: "individual" | "organization";
}

export function buildSavedOpportunityTags(
  opportunity: BaseOpportunity,
  userOrganizationIds: Set<string> = new Set<string>(),
  isSavedByUser: boolean,
): SavedOpportunityTag[] {
  const organizationTags = (opportunity.saved_to_organizations ?? [])
    // Only include organizations the current user belongs to
    .filter((organization) =>
      userOrganizationIds.has(organization.organization_id),
    )
    // Ensure valid, non-empty names
    .filter((organization) => {
      const organizationName = organization.organization_name?.trim();
      return Boolean(organizationName);
    })
    // Sort organization tags alphabetically by display name
    .sort((firstOrganization, secondOrganization) =>
      (firstOrganization.organization_name ?? "").localeCompare(
        secondOrganization.organization_name ?? "",
      ),
    )
    // Map organizations into the shared tag structure
    .map((organization) => {
      const organizationName = organization.organization_name!.trim();

      return {
        key: `organization-${organization.organization_id}`,
        label: organizationName,
        screenReaderLabel: `Shared with ${organizationName}`,
        kind: "organization" as const,
      };
    });

  // Only show the Individual tag when the opportunity was saved by the user.
  // Opportunities may now appear in the saved list because they were saved only
  // by one of the user's organizations.
  const individualTags: SavedOpportunityTag[] = isSavedByUser
    ? [
        {
          key: "individual",
          label: "Individual",
          screenReaderLabel: "Saved to your list",
          kind: "individual",
        },
      ]
    : [];

  return [...individualTags, ...organizationTags];
}
