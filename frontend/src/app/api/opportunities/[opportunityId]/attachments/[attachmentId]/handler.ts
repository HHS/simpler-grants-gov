import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteOpportunityAttachment } from "src/services/fetch/fetchers/opportunityAttachmentFetcher";

export const deleteOpportunityAttachmentHandler = async (
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ opportunityId: string; attachmentId: string }>;
  },
) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session");
    }

    const { opportunityId, attachmentId } = await params;

    const response = await deleteOpportunityAttachment(
      opportunityId,
      attachmentId,
    );
    const status = response.status_code;

    if (!response || status !== 200) {
      throw new ApiRequestError(
        `Error deleting attachment: ${response.message}`,
        "APIRequestError",
        status,
      );
    }

    return Response.json({
      message: "Opportunity attachment deletion success",
      data: response,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      { message: `Error deleting attachment: ${message}` },
      { status },
    );
  }
};
