import { Organization } from "./applicationResponseTypes";

export interface UserOrganization extends Organization {
  is_organization_owner: boolean;
}

export interface RoleDefinition {
  privileges: string[];
  role_id: string;
  role_name: string;
}

export type UserProfileValidationErrors = {
  firstName?: string[];
  lastName?: string[];
};

export interface UserDetailProfile {
  first_name: string;
  middle_name?: string;
  last_name: string;
}

export interface UserDetail {
  user_id: string;
  email: string;
  profile: UserDetailProfile | null;
  roles?: RoleDefinition[];
}

export interface UserProfileResponse {
  validationErrors?: UserProfileValidationErrors;
  errorMessage?: string;
  data?: UserDetail;
  success?: boolean;
}
