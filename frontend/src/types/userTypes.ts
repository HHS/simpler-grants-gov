import { Organization } from "./applicationResponseTypes";

export interface UserOrganization extends Organization {
  is_organization_owner: boolean;
}

export type GatedResourceTypes = "application" | "organization" | "agency";

export type UserPrivilegeDefinition = {
  resourceId?: string;
  resourceType: GatedResourceTypes;
  privilege: string; // we can narrow this later
};

export type UserPrivilegesDefinition = {
  resourceId?: string;
  privileges: string[]; // we can narrow this later
};

export type UserRole = {
  role_id: string;
  role_name: string;
  privileges: string[];
};

export type OrganizationPrivilegesResponse = {
  organization: {
    organization_id: string;
  };
  organization_user_roles: UserRole[];
};

export type ApplicationPrivilegesResponse = {
  application: {
    application_id: string;
  };
  application_user_roles: UserRole[];
};

export type AgencyPrivilegesResponse = {
  agency: {
    agency_id: string;
  };
  agency_user_roles: UserRole[];
};

export type UserPrivilegesResponse = {
  user_id: string;
  organization_users: OrganizationPrivilegesResponse[];
  application_users: ApplicationPrivilegesResponse[];
  agency_users: AgencyPrivilegesResponse[];
};

export type UserProfileValidationErrors = {
  firstName?: string[];
  lastName?: string[];
};

export interface UserDetailProfile {
  first_name: string;
  middle_name?: string;
  last_name: string;
}

export interface UserDetail extends UserDetailProfile {
  user_id: string;
  email: string;
  roles?: UserRole[];
}

export interface UserDetailWithProfile {
  user_id: string;
  email: string;
  external_user_type: string;
  profile: UserDetailProfile;
}

export interface UserProfileResponse {
  validationErrors?: UserProfileValidationErrors;
  errorMessage?: string;
  data?: UserDetailProfile;
  success?: boolean;
}
