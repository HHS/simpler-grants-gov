import { UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { Organization } from "src/types/applicationResponseTypes";
import { OrganizationInviteRecord } from "src/types/organizationTypes";
import {
  OrganizationInvitationStatus,
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
  });

  const json = (await resp.json()) as { data: UserDetail[] };

  // Sort by email, this will be temp until we get the results from the backend with sorting applied
  const sorted = [...json.data].sort((first, second) => {
    const a = (first.email ?? "").toLowerCase();
    const b = (second.email ?? "").toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return sorted;
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

  try {
    const resp = await fetchOrganizationWithMethod("DELETE")({
      subPath: `${organizationId}/users/${userId}`,
      additionalHeaders: { "X-SGG-TOKEN": session.token },
    });

    if (!resp.ok) {
      let error: string | undefined;

      try {
        const body: unknown = await resp.json();

        if (
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof (body as { message?: unknown }).message === "string"
        ) {
          error = (body as { message: string }).message;
        }
      } catch {
        console.warn("Failed to parse error body when removing org user");
      }

      if (resp.status === 401) {
        throw new UnauthorizedError(
          error ?? "No active session for removing users.",
        );
      }

      throw new Error(
        error ??
          (resp.status === 403
            ? "You cannot remove this user. At least one admin is required for the organization."
            : "Unable to remove this user right now. Please try again."),
      );
    }

    const json = (await resp.json()) as { data: UserDetail };
    return json.data;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    // any unexpected failure
    throw new Error(
      "We couldn't remove this user due to an unexpected error. Please check your connection and try again.",
    );
  }
};
