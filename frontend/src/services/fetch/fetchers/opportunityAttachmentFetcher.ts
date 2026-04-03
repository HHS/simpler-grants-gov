import "server-only";

import { toDynamicGrantorOpportunityEndpoint } from "src/services/fetch/endpointConfigs";
import {
  OpportunityAttachmentListResponse,
  OpportunityAttachmentUploadResponse,
} from "src/types/opportunity/opportunityAttachmentTypes";

import { requesterForEndpoint } from "./fetchers";

const fetchGrantorOpportunityWithMethod = (type: "POST" | "DELETE" | "GET") =>
  requesterForEndpoint(toDynamicGrantorOpportunityEndpoint(type));

export const listOpportunityAttachments = async (
  opportunityId: string,
  token: string,
): Promise<OpportunityAttachmentListResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("GET")({
    subPath: `${opportunityId}/attachments`,
    additionalHeaders: { "X-SGG-Token": token },
  });
  return (await response.json()) as OpportunityAttachmentListResponse;
};

export const uploadOpportunityAttachment = async (
  opportunityId: string,
  token: string,
  file: FormData,
): Promise<OpportunityAttachmentUploadResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/attachments`,
    additionalHeaders: {
      "X-SGG-Token": token,
      Accept: "application/json",
    },
    body: file,
    addContentType: false,
  });
  return (await response.json()) as OpportunityAttachmentUploadResponse;
};

export const deleteOpportunityAttachment = async (
  opportunityId: string,
  attachmentId: string,
  token: string,
): Promise<{ status_code: number; message: string }> => {
  const response = await fetchGrantorOpportunityWithMethod("DELETE")({
    subPath: `${opportunityId}/attachments/${attachmentId}`,
    additionalHeaders: { "X-SGG-Token": token },
  });
  return (await response.json()) as { status_code: number; message: string };
};
