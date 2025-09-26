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

export interface UserProfile {
  first_name: string;
  middle_name?: string;
  last_name: string;
}

export interface UserDetail {
  user_id: string;
  email: string;
  profile: UserProfile | null;
}

export interface UserProfileResponse {
  validationErrors?: UserProfileValidationErrors;
  errorMessage?: string;
  data?: UserDetail;
}
