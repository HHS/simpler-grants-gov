import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { Organization } from "src/types/applicationResponseTypes";
import { OrganizationInviteRecord } from "src/types/organizationTypes";
import {
  OrganizationPendingInvitation,
  UserDetail,
  UserRole,
} from "src/types/userTypes";

import { fetchOrganizationWithMethod, fetchUserWithMethod } from "./fetchers";

export const getOrganizationDetails = async (
  organizationId: string,
): Promise<Organization> => {
  const session = await getSession();
  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }
  const ssgToken = {
    "X-SGG-Token": session.token,
  };
  const resp = await fetchOrganizationWithMethod("GET")({
    subPath: organizationId,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: Organization };
  return json.data;
};

export const getUserOrganizations = async (
  token: string,
  userId: string,
): Promise<Organization[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchUserWithMethod("GET")({
    subPath: `${userId}/organizations`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: Organization[] };
  return json.data;
};

export const getOrganizationUsers = async (
  token: string,
  organizationId: string,
): Promise<UserDetail[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/users`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserDetail[] };
  return json.data;
};

export const getOrganizationRoles = async (
  token: string,
  organizationId: string,
): Promise<UserRole[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/roles/list`,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: UserRole[] };
  return json.data;
};

export const inviteUserToOrganization = async (
  token: string,
  requestData: {
    organizationId: string;
    roleId: string[];
    email: string;
  },
): Promise<OrganizationInviteRecord> => {
  const { organizationId, roleId, email } = requestData;
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/invitations`,
    additionalHeaders: ssgToken,
    body: {
      invitee_email: email,
      role_ids: roleId,
    },
  });
  const json = (await response.json()) as { data: OrganizationInviteRecord };
  return json.data;
};

export const getOrganizationPendingInvitations = async (
  organizationId: string,
): Promise<OrganizationPendingInvitation[]> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const ssgToken = {
    "X-SGG-Token": session.token,
  };
  const response = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/invitations/list`,
    additionalHeaders: ssgToken,
    body: {
      filters: {
        status: {
          one_of: ["pending"],
        },
      },
    },
  });

  const json = (await response.json()) as {
    data: OrganizationPendingInvitation[];
  };
  return json.data;
};
