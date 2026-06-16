import "server-only";

import { fileUploadProcessStatus } from "src/types/fileUploadTypes";
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

// for now this just iterates through the valid statuses and delivers them in a stream in 1 second intervals
export const attachOpportunityFile = async ({
  opportunityId,
  pendingFileId,
}: {
  opportunityId: string;
  pendingFileId: string;
}) => {
  console.log("!!! attaching", opportunityId, pendingFileId);
  const maxQueues = fileUploadProcessStatus.length;
  let queueIndex = 0;
  const stream = new ReadableStream({
    start: (controller) => {
      const intervalId = setInterval(() => {
        try {
          if (queueIndex === maxQueues) {
            controller.close();
            clearInterval(intervalId);
            queueIndex = 0;
            return;
          }
          controller.enqueue(fileUploadProcessStatus[queueIndex]);
          queueIndex++;
        } catch (e) {
          queueIndex = 0;
          console.error(e);
          controller.close();
          clearInterval(intervalId);
        }
      }, 1000);
    },
  });
  const response = new Response(stream);
  return response;
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
