import { APIResponse } from "src/types/apiResponseTypes";
import { WorkflowDetails } from "src/types/workflowTypes";

import { fetchWorkflow } from "./fetchers";

export const getWorkflowDetails = async (
  workflowId: string,
): Promise<WorkflowDetails> => {
  const response = await fetchWorkflow({ subPath: workflowId });
  const responseBody = (await response.json()) as APIResponse;
  return responseBody.data as WorkflowDetails;
};
