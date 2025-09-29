export type Organization = {
  is_organization_owner: boolean;
  organization_id: string;
  sam_gov_entity: {
    expiration_date: string;
    legal_business_name: string;
    uei: string;
  };
};

export type UserPrivilegeDefinition = {
  resourceId?: string;
  privilege: string; // we can narrow this later
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
  agency_user_roles: {
    agency_id: string;
    agency_user_roles: UserRole[];
  }[];
};
