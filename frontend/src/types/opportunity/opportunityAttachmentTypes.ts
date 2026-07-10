import { APIResponse } from "src/types/apiResponseTypes";

export type OpportunityAttachment = {
  opportunity_attachment_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

export interface OpportunityAttachmentListResponse extends APIResponse {
  data: OpportunityAttachment[];
}

export interface OpportunityAttachmentUploadResponse extends APIResponse {
  data: { opportunity_attachment_id: string };
}
