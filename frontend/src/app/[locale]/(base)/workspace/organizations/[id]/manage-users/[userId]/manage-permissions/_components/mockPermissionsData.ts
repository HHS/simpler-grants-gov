// Placeholder data for the manage-permissions UI. Replace with data from the
// API once the page is wired up to live endpoints.

export type ApplicationAccessScope = "all" | "selected";

export interface PermissionsApplication {
  applicationId: string;
  applicationName: string;
}

export interface ManagedUserPermissions {
  name: string;
  roleName: string;
  // Display placeholders until the API provides who changed the role and when
  roleLastUpdatedBy: string;
  roleLastUpdatedAt: string;
  isExternal: boolean;
  accessScope: ApplicationAccessScope;
  selectedApplicationIds: string[];
}

export const mockManagedUserPermissions: ManagedUserPermissions = {
  name: "Susie Sales",
  roleName: "Collaborator",
  roleLastUpdatedBy: "Jane Doe",
  roleLastUpdatedAt: "November 10, 2026 at 3:15 PM",
  isExternal: false,
  accessScope: "all",
  selectedApplicationIds: [],
};

export const mockOrganizationApplications: PermissionsApplication[] = [
  {
    applicationId: "mock-application-1",
    applicationName: "Application Name 1",
  },
  {
    applicationId: "mock-application-2",
    applicationName: "Application Name 2",
  },
  {
    applicationId: "mock-application-3",
    applicationName: "Application Name 3",
  },
  {
    applicationId: "mock-application-4",
    applicationName: "Application Name 4",
  },
  {
    applicationId: "mock-application-5",
    applicationName: "Application Name 5",
  },
];
