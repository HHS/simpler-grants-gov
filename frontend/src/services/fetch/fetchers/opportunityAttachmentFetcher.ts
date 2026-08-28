import "server-only";

import {
  OpportunityAttachmentCreateResponse,
  OpportunityAttachmentListResponse,
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

export const createOpportunityAttachment = async (
  opportunityId: string,
  pendingFileId: string,
): Promise<OpportunityAttachmentCreateResponse> => {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/attachments/temporary`,
    body: { pending_file_id: pendingFileId },
    // want to allow responses with failed validations through so we can properly handle displaying validation errors
    allowedErrorStatuses: [422],
  });
  return (await response.json()) as OpportunityAttachmentCreateResponse;
};

export const deleteOpportunityAttachment = async (
  opportunityId: string,
  attachmentId: string,
): Promise<{
  status_code: number;
  message: string;
  errors?: unknown[] | null;
}> => {
  const response = await fetchGrantorOpportunityWithMethod("DELETE")({
    subPath: `${opportunityId}/attachments/${attachmentId}`,
    // want to allow responses with failed validations through so we can properly handle displaying validation errors
    allowedErrorStatuses: [422],
  });
  return (await response.json()) as {
    status_code: number;
    message: string;
    errors?: unknown[] | null;
  };
};
