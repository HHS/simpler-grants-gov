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
): Promise<OpportunityAttachmentListResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("GET")({
    subPath: `${opportunityId}/attachments`,
  });
  return (await response.json()) as OpportunityAttachmentListResponse;
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
