import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleSubmitApplication } from "src/services/fetch/fetchers/applicationFetcher";

export const submitApplicationHandler = async (
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session submit application");
    }
    const applicationId = (await params).applicationId;

    const response = await handleSubmitApplication(
      applicationId,
      session.token,
    );
    const status = response.status_code;

    if (!response || (status !== 200 && status !== 422)) {
      throw new ApiRequestError(
        `Error submitting application: ${response.message}`,
        "APIRequestError",
        status,
      );
    }
    return Response.json({
      message:
        status === 200
          ? "Application submit success"
          : "Validation errors for submitted application",
      data: response,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to submit application: ${message}`,
      },
      { status },
    );
  }
};
