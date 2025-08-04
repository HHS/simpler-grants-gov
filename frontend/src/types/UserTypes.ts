export type Organization = {
  is_organization_owner: boolean;
  organization_id: string;
  sam_gov_entity: {
    expiration_date: string;
    legal_business_name: string;
    uei: string;
  };
};
