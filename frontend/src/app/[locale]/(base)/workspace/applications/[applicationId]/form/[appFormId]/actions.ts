"use server";

import { RJSFSchema } from "@rjsf/utils";
import { getSession } from "src/services/auth/session";
import {
  deleteAttachment,
  handleUpdateApplicationForm,
  uploadAttachment,
} from "src/services/fetch/fetchers/applicationFetcher";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { ApplicationResponseDetail } from "src/types/applicationResponseTypes";
import { FormDetail } from "src/types/formResponseTypes";
import {
  processFormSchema,
  shapeFormData,
} from "src/utils/applyForm/applyFormUtils";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { revalidateTag } from "next/cache";

type ApplyFormResponse = {
  applicationId: string;
  error: boolean;
  formData: object;
  formId: string;
  saved: boolean;
};

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
    const res = await uploadAttachment(applicationId, fileFormData);

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
    const res = await deleteAttachment(applicationId, applicationAttachmentId);

    if (res.status_code !== 200) {
      throw new Error(`Failed to delete application: ${res.status_code}`);
    }

    revalidateTag(`application-${applicationId}`, "max");

    return { success: true, error: null };
  } catch (_e) {
    return { success: false, error: "Failed to delete attachment." };
  }
};

export async function handleFormAction(
  prevState: ApplyFormResponse,
  formData: FormData,
) {
  const { formId, applicationId } = prevState;
  const session = await getSession();
  if (!session || !session.token) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: false,
    };
  }

  const formSchema = await getFormSchema(formId);
  if (!formSchema) {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: false,
    };
  }

  // this generic typing isn't correct - we'll end up with a nested object
  const applicationFormData = shapeFormData<ApplicationResponseDetail>(
    formData,
    formSchema,
  );

  const saveSuccess = await handleSave(
    applicationFormData,
    applicationId,
    formId,
  );
  if (saveSuccess) {
    return {
      applicationId,
      error: false,
      formData: applicationFormData,
      formId,
      saved: true,
    };
  } else {
    return {
      applicationId,
      error: true,
      formData,
      formId,
      saved: false,
    };
  }
}

const handleSave = async (
  applicationFormData: ApplicationResponseDetail,
  applicationId: string,
  formId: string,
) => {
  try {
    const resp = await handleUpdateApplicationForm(
      applicationFormData,
      applicationId,
      formId,
    );
    if (resp.status_code === 200) {
      return true;
    }
    return false;
  } catch (e) {
    console.error(
      `Error saving the form (${formId}) for application (${applicationId}):`,
      e,
    );
    return false;
  }
};

// get and process the form schema, which is then used to determing proper typing for save form payload data
async function getFormSchema(formId: string): Promise<RJSFSchema | undefined> {
  let formDetail = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
    if (response.status_code !== 200) {
      console.error(
        `Error retrieving form details for formID (${formId})`,
        response,
      );
    }
    formDetail = response.data;
  } catch (e) {
    console.error(`Error retrieving form details for formID (${formId})`, e);
  }
  try {
    const { formSchema } = processFormSchema(formDetail.form_json_schema);
    return formSchema;
  } catch (e) {
    console.error(`Error parsing JSON schema for ${formId}`, e);
    return undefined;
  }
}
