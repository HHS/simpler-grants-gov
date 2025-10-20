import { RoleDefinition } from "./userTypes";

export type OrganizationInviteRecord = {
  organization_invitation_id: string;
  organization_id: string;
  invitee_email: string;
  status: string; // can be limited
  roles: RoleDefinition[];
  expires_at?: Date;
  created_at?: Date;
};
