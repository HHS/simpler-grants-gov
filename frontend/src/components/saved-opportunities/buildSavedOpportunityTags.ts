import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

export interface SavedOpportunityTag {
  key: string;
  label: string;
  screenReaderLabel: string;
  kind: "individual" | "organization";
}

export function buildSavedOpportunityTags(
  opportunity: BaseOpportunity,
): SavedOpportunityTag[] {
  const organizationTags = (opportunity.saved_to_organizations ?? [])
    .filter((organization) => {
      const organizationName = organization.organization_name?.trim();
      return Boolean(organizationName);
    })
    .sort((firstOrganization, secondOrganization) =>
      (firstOrganization.organization_name ?? "").localeCompare(
        secondOrganization.organization_name ?? "",
      ),
    )
    .map((organization) => {
      const organizationName = organization.organization_name!.trim();

      return {
        key: `organization-${organization.organization_id}`,
        label: organizationName,
        screenReaderLabel: `Shared with ${organizationName}`,
        kind: "organization" as const,
      };
    });

  return [
    {
      key: "individual",
      label: "Individual",
      screenReaderLabel: "Saved to your list",
      kind: "individual" as const,
    },
    ...organizationTags,
  ];
}
