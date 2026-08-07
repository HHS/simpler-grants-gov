export type WorkflowState =
  | "start"
  | "pending_revision_start"
  | "pending_pqc_review"
  | "pending_gms_review_start"
  | "pending_gms_review"
  | "pending_gmo_review"
  | "pending_fmo_review";

export type WorkflowDetails = {
  workflow_id: string;
  current_workflow_state: WorkflowState;
  // Add other workflow fields as needed
};
