"use server";

import { getSession } from "src/services/auth/session";
import {
  deleteAttachment,
  uploadAttachment,
} from "src/services/fetch/fetchers/applicationFetcher";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { revalidateTag } from "next/cache";

export type UploadAttachmentActionState =
  | {
      success: boolean;
      error: string | undefined;
      uploads: {
        tempId: string | null;
        abortController: AbortController | null;
      };
    }
  | undefined;

export type DeleteAttachmentActionState =
  | {
      success: boolean;
      error: string | null;
    }
  | undefined;

type DeleteAttachmentActionProps = {
  applicationId: string;
  applicationAttachmentId: string;
};

export interface UploadAttachmentAction {
  formData: FormData;
  tempId: string;
  abortController: AbortController;
}

export const uploadAttachmentAction = async (
  _prevState: UploadAttachmentActionState | undefined,
  { formData, tempId, abortController }: UploadAttachmentAction,
): Promise<UploadAttachmentActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
      uploads: {
        tempId: null,
        abortController: null,
      },
    };
  }

  const applicationId = formData.get("application_id") as string;
  const file = formData.get("file_attachment") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileFormData = createFormData(file.name, buffer, file.type);

  const uploadState = {
    tempId,
    abortController,
  };

  try {
    const res = await uploadAttachment(
      applicationId,
      session.token,
      fileFormData,
    );

    if (res.status_code !== 200) {
      throw new Error(`Failed to update application: ${res.status_code}`);
    }

    revalidateTag(`application-${applicationId}`, "max");

    return { success: true, error: undefined, uploads: uploadState };
  } catch (_e) {
    return {
      success: false,
      error: "Failed to upload attachment.",
      uploads: {
        tempId: null,
        abortController: null,
      },
    };
  }
};

export const deleteAttachmentAction = async (
  _prevState: DeleteAttachmentActionState | undefined,
  { applicationId, applicationAttachmentId }: DeleteAttachmentActionProps,
): Promise<DeleteAttachmentActionState> => {
  const session = await getSession();

  if (!session || !session.token) {
    return {
      success: false,
      error: "Session has expired",
    };
  }

  try {
    const res = await deleteAttachment(
      applicationId,
      applicationAttachmentId,
      session.token,
    );

    if (res.status_code !== 200) {
      throw new Error(`Failed to delete application: ${res.status_code}`);
    }

    revalidateTag(`application-${applicationId}`, "max");

    return { success: true, error: null };
  } catch (_e) {
    return { success: false, error: "Failed to delete attachment." };
  }
};
