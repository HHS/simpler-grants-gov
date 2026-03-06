"use server";

import { getSession } from "src/services/auth/session";
import { updateApplicationFilingName } from "src/services/fetch/fetchers/applicationFetcher";

import { revalidateTag } from "next/cache";

export type UpdateAppFilingNameActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

export const updateAppFilingNameAction = async (
  _prevState: UpdateAppFilingNameActionState | undefined,
  formData: FormData,
): Promise<UpdateAppFilingNameActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }

  const applicationId = formData.get("application_id") as string;
  const applicationName = formData.get("application_name") as string;

  try {
    const res = await updateApplicationFilingName(session.token, {
      application_id: applicationId,
      application_name: applicationName,
    });

    if (res.status_code !== 200) {
      throw new Error(`Failed to update application: ${res.status_code}`);
    }

    revalidateTag(`application-${applicationId}`, "max");

    return { success: true, error: null };
  } catch (error) {
    console.error("Update failed:", error);
    return { success: false, error: "Failed to update application name." };
  }
};
