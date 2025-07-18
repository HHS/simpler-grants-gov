"use client";

import { debounce } from "lodash";
import { UserSession } from "src/types/authTypes";
import { Organization } from "src/types/UserTypes";

// if we don't debounce this call we get multiple requests going out on page load
// not using clientFetch since we don't need to check the expiration here
// and also that'd create a circular dependency chain in the cilentFetch hook
export const debouncedUserFetcher = debounce(
  async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (response.ok && response.status === 200) {
      const data = (await response.json()) as UserSession;
      return data;
    }
    throw new Error(`Unable to fetch user: ${response.status}`);
  },
  500,
  {
    leading: true,
    trailing: false,
  },
);

export const userOrganizationFetcher = async () => {
  const response = await fetch("/api/user/organizations", {
    cache: "no-store",
  });
  if (response.ok && response.status === 200) {
    const data = (await response.json()) as Organization[];
    return data;
  }
  throw new Error(`Unable to fetch user organization: ${response.status}`);
};
