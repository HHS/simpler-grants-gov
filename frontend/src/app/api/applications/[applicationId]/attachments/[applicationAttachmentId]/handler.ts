import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { revalidateTag } from "next/cache";

export const deleteAttachmentHandler = async (
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ applicationId: string; applicationAttachmentId: string }>;
  },
) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session");
    }
    const applicationId = (await params).applicationId;
    const applicationAttachmentId = (await params).applicationAttachmentId;

    const response = await deleteAttachment(
      applicationId,
      applicationAttachmentId,
      session.token,
    );
    const status = response.status_code;

    revalidateTag(`application-${applicationId}`);

    if (!response || status !== 200) {
      throw new ApiRequestError(
        `Error deleting attachment: ${response.message}`,
        "APIRequestError",
        status,
      );
    }
    // TODO: add error message
    return Response.json({
      message: status === 200 ? "Application attachment deletion success" : "",
      data: response,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error deleting attachment: ${message}`,
      },
      { status },
    );
  }
};
