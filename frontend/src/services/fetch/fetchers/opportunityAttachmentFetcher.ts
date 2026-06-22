import "server-only";

import {
  OpportunityAttachmentListResponse,
  OpportunityAttachmentUploadResponse,
} from "src/types/opportunity/opportunityAttachmentTypes";

import { fetchGrantorOpportunityWithMethod } from "./fetchers";

export const listOpportunityAttachments = async (
  opportunityId: string,
): Promise<OpportunityAttachmentListResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("GET")({
    subPath: `${opportunityId}/attachments`,
  });
  return (await response.json()) as OpportunityAttachmentListResponse;
};

export const attachOpportunityFile = async ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  opportunityId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pendingFileId,
}: {
  opportunityId: string;
  pendingFileId: string;
}): Promise<Response> => {
  return await new Promise((resolve) => resolve(new Response()));
  // return new Promise((_resolve, reject) =>
  //   reject(new Error("simluate post upload action error response")),
  // );
};

export const uploadOpportunityAttachment = async (
  opportunityId: string,
  file: FormData,
): Promise<OpportunityAttachmentUploadResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/attachments`,
    additionalHeaders: { Accept: "application/json" },
    body: file,
    addContentType: false,
  });
  return (await response.json()) as OpportunityAttachmentUploadResponse;
};

export const deleteOpportunityAttachment = async (
  opportunityId: string,
  attachmentId: string,
): Promise<{ status_code: number; message: string }> => {
  const response = await fetchGrantorOpportunityWithMethod("DELETE")({
    subPath: `${opportunityId}/attachments/${attachmentId}`,
  });
  return (await response.json()) as { status_code: number; message: string };
};
