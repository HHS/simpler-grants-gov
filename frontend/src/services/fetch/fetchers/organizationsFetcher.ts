import { Organization } from "src/types/applicationResponseTypes";

import { fetchUserWithMethod, getOrganization } from "./fetchers";

export const getOrganizationDetails = async (
  token: string,
  organizationId: string,
): Promise<Organization> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await getOrganization({
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

export const getOrganizationUsers = (
  token: string,
  organizationId: string,
): Promise<Organization> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const resp = await getOrganization({
    subPath: organizationId,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: Organization };
  return json.data;
};
