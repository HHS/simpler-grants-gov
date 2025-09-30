export type Organization = {
  is_organization_owner: boolean;
  organization_id: string;
  sam_gov_entity: {
    expiration_date: string;
    legal_business_name: string;
    uei: string;
  };
};

export type UserProfileValidationErrors = {
  firstName?: string[];
  lastName?: string[];
};

export interface DynamicUserDetails {
  first_name: string;
  middle_name?: string;
  last_name: string;
}

export interface UserDetail extends DynamicUserDetails {
  id: string;
  email: string;
}

export interface UserProfileResponse {
  validationErrors?: UserProfileValidationErrors;
  errorMessage?: string;
  data?: UserDetail;
}

export type UserPrivilegeDefinition = {
  resourceId?: string;
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
// export type ResourceUserRole<T_ID, T_UR> = {
//   [T_ID]: string;
//   [T_UR]: UserRole[];
// }

export type UserPrivilegesResponse = {
  user_id: string;
  organization_user_roles: {
    organization_id: string;
    organization_user_roles: UserRole[];
  }[];
  application_user_roles: {
    application_id: string;
    application_user_roles: UserRole[];
  }[];
};
