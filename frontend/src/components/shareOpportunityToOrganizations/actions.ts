"use server";

import { getSession } from "src/services/auth/session";
import {
  deleteSavedOpportunityForOrganization,
  saveOpportunityForOrganization,
} from "src/services/fetch/fetchers/organizationSavedOpportunitiesFetcher";

export type SaveOpportunityForOrganizationActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

export type DeleteSavedOpportunityForOrganizationActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

export type SaveOpportunityForOrganizationActionProps = {
  organizationId: string;
  opportunityId: string;
};

export type DeleteSavedOpportunityForOrganizationActionProps = {
  organizationId: string;
  opportunityId: string;
};

type OrganizationSavedOpportunityApiResponse = {
  data: Record<string, never>;
  message: string;
  status_code: number;
  errors?: unknown[];
  internal_request_id?: string;
};

export const saveOpportunityForOrganizationAction = async ({
  organizationId,
  opportunityId,
}: SaveOpportunityForOrganizationActionProps): Promise<SaveOpportunityForOrganizationActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }

  try {
    const response = await saveOpportunityForOrganization({
      organizationId,
      opportunityId,
      token: session.token,
    });

    const responseJson =
      (await response.json()) as OrganizationSavedOpportunityApiResponse;

    if (!response.ok || responseJson.status_code !== 200) {
      throw new Error(
        `Failed to save opportunity for organization: ${responseJson.message}`,
      );
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Save opportunity for organization failed:", error);
    return {
      success: false,
      error: "Failed to save opportunity for organization.",
    };
  }
};

export const deleteSavedOpportunityForOrganizationAction = async ({
  organizationId,
  opportunityId,
}: DeleteSavedOpportunityForOrganizationActionProps): Promise<DeleteSavedOpportunityForOrganizationActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }

  try {
    const response = await deleteSavedOpportunityForOrganization({
      organizationId,
      opportunityId,
      token: session.token,
    });

    const responseJson =
      (await response.json()) as OrganizationSavedOpportunityApiResponse;

    if (!response.ok || responseJson.status_code !== 200) {
      throw new Error(
        `Failed to delete saved opportunity for organization: ${responseJson.message}`,
      );
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Delete saved opportunity for organization failed:", error);
    return {
      success: false,
      error: "Failed to delete saved opportunity for organization.",
    };
  }
};
