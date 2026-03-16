"use server";

import { getSession } from "src/services/auth/session";
import {
  deleteOrganization,
  addOrganization,
} from "src/services/fetch/fetchers/organizationsFetcher";

import { revalidateTag } from "next/cache";

export type AddOrganizationActionState =
  | {
      success: boolean;
      error: string | undefined;
    }
  | undefined;

export type DeleteOrganizationActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

type DeleteOrganizationActionProps = {
  opportunityId: string; 
  organizationId: string;
};

export interface AddOrganizationAction {
  organizationId: string;
}

export const addOrganizationAction = async (
  _prevState: AddOrganizationActionState | undefined,
  { organizationId }: AddOrganizationAction,
): Promise<AddOrganizationActionState> => {
    console.log("in addOrganizationAction organizationId: " + organizationId);  
  const session = await getSession();
  
  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }
  console.log("calling addOrganization organizationId: " + organizationId);
  try {
    const res = await addOrganization(
      organizationId,
    );

    revalidateTag(`organization-${organizationId}`, "max");
    console.log("returning repsonse of sucess");
    return { success: true, error: undefined};
  } catch (_e) {
    console.log("retuning success = false");
    return {
      success: false,
      error: "Failed to add organization.",
    };
  }
};

export const deleteOrganizationAction = async (
  _prevState: DeleteOrganizationActionState | undefined,
  { opportunityId, organizationId }: DeleteOrganizationActionProps,
): Promise<DeleteOrganizationActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }

  try {
    const res = await deleteOrganization(
      opportunityId,
      organizationId,
    );

    revalidateTag(`organization-${organizationId}`, "max");

    return { success: true, error: null };
  } catch (_e) {
    return { success: false, error: "Failed to delete organization." };
  }
};
