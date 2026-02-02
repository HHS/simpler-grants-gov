import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { Organization } from "src/types/applicationResponseTypes";
import { OrganizationInviteRecord } from "src/types/organizationTypes";
import {
  OrganizationInvitationStatus,
  OrganizationLegacyUser,
  OrganizationLegacyUserStatus,
  OrganizationPendingInvitation,
  UserDetail,
  UserRole,
} from "src/types/userTypes";
import { throwOnApiError } from "src/utils/apiUtils";

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
  organizationId: string,
): Promise<UserDetail[]> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const ssgToken = {
    "X-SGG-Token": session.token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/users`,
    additionalHeaders: ssgToken,
    body: {
      pagination: {
        page_offset: 1,
        page_size: 5000,
        sort_order: [
          {
            order_by: "email",
            sort_direction: "ascending",
          },
        ],
      },
    },
  });

  const json = (await resp.json()) as { data: UserDetail[] };

  return json.data;
};

export const getOrganizationRoles = async (
  organizationId: string,
): Promise<UserRole[]> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const ssgToken = {
    "X-SGG-Token": session.token,
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
          one_of: [OrganizationInvitationStatus.Pending],
        },
      },
    },
  });

  const json = (await response.json()) as {
    data: OrganizationPendingInvitation[];
  };

  // Sort by email, this will be temp until we get the results from the backend with sorting applied
  const sorted = [...json.data].sort((first, second) => {
    const a = (first.invitee_email ?? "").toLowerCase();
    const b = (second.invitee_email ?? "").toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return sorted;
};

export const updateOrganizationUserRoles = async (
  organizationId: string,
  userId: string,
  roleIds: string[],
): Promise<UserDetail> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const resp = await fetchOrganizationWithMethod("PUT")({
    subPath: `${organizationId}/users/${userId}`,
    additionalHeaders: { "X-SGG-TOKEN": session.token },
    body: { role_ids: roleIds },
  });

  if (!resp.ok) {
    await throwOnApiError(resp, {
      operationName: "updateOrganizationUserRoles",
      unauthorizedMessage: "No active session for updating user roles.",
    });
  }

  const json = (await resp.json()) as { data: UserDetail };
  return json.data;
};

export const removeOrganizationUser = async (
  organizationId: string,
  userId: string,
): Promise<UserDetail> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const resp = await fetchOrganizationWithMethod("DELETE")({
    subPath: `${organizationId}/users/${userId}`,
    additionalHeaders: { "X-SGG-TOKEN": session.token },
  });

  if (!resp.ok) {
    await throwOnApiError(resp, {
      operationName: "removeOrganizationUser",
      unauthorizedMessage: "No active session for removing users.",
    });
  }

  const json = (await resp.json()) as { data: UserDetail };
  return json.data;
};

export const getOrganizationLegacyUsers = async (
  organizationId: string,
): Promise<OrganizationLegacyUser[]> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const ssgToken = {
    "X-SGG-Token": session.token,
  };
  const resp = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/legacy-users`,
    additionalHeaders: ssgToken,
    body: {
      filters: {
        status: {
          one_of: [
            OrganizationLegacyUserStatus.Available,
            OrganizationLegacyUserStatus.Member,
            OrganizationLegacyUserStatus.PendingInvitation,
          ],
        },
      },
      pagination: {
        page_offset: 1,
        page_size: 5000,
        sort_order: [
          {
            order_by: "email",
            sort_direction: "ascending",
          },
        ],
      },
    },
  });

  if (!resp.ok) {
    await throwOnApiError(resp, {
      operationName: "getOrganizationLegacyUsers",
      unauthorizedMessage: "No active session for managing legacy users.",
    });
  }

  const json = (await resp.json()) as { data: OrganizationLegacyUser[] };
  return json.data;
};
