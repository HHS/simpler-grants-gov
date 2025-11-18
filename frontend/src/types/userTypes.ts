import { Organization } from "./applicationResponseTypes";

export interface UserOrganization extends Organization {
  is_organization_owner: boolean;
}

export type GatedResourceTypes = "application" | "organization" | "agency";

export type Privileges =
  | "manage_org_members"
  | "manage_org_admin_members"
  | "view_org_membership"
  | "start_application"
  | "list_application"
  | "view_application"
  | "modify_application"
  | "submit_application"
  | "update_form"
  | "manage_agency_members"
  | "get_submitted_applications";

export interface UserPrivilegeDefinition {
  resourceId?: string;
  resourceType: GatedResourceTypes;
  privilege: Privileges;
}

export interface UserPrivilegeResult extends UserPrivilegeDefinition {
  authorized: boolean;
  error?: string;
}

export interface RoleDefinition {
  role_id: string;
  role_name: string;
}
export interface UserRole extends RoleDefinition {
  privileges: Privileges[];
}
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
  roles?: UserRole[];
}

export interface UserDetail extends UserDetailProfile {
  user_id: string;
  email: string;
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

export type OrganizationInvitation = {
  organization_invitation_id: string;
  organization: {
    organization_id: string;
    organization_name: string;
  };
  status: string; // can enum later
  created_at: string;
  expires_at: string;
  inviter: UserDetail;
  roles: UserRole[];
};

export const completeStatuses = ["rejected", "accepted", "expired"];

export interface InvitationUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface OrganizationPendingInvitation {
  organization_invitation_id: string;
  status: "pending" | "accepted" | "rejected" | "expired" | string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  invitee_email: string;
  invitee_user: InvitationUser | null;
  inviter_user: InvitationUser;
  roles: UserRole[];
}
