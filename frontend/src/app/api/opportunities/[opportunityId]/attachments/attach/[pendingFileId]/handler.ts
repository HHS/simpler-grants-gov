import { ApiRequestError, readError } from "src/errors";
import { attachOpportunityFile } from "src/services/fetch/fetchers/opportunityAttachmentFetcher";

export const attachOpportunityAttachmentHandler = async (
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ opportunityId: string; pendingFileId: string }>;
  },
) => {
  try {
    const { opportunityId, pendingFileId } = await params;

    const response = await attachOpportunityFile({
      opportunityId,
      pendingFileId,
    });
    const status = response.status;

    if (!response || status !== 200) {
      throw new ApiRequestError(
        "Error attaching file",
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
