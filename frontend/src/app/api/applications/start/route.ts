import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { handleStartApplication } from "src/services/fetch/fetchers/applicationFetcher";
import { COMPETITION_ID } from "src/types/competitions";

export const POST = async () => {
  try {
    // TODO: add session support;
    const session = { token: true };
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session start application");
    }

    const response = await handleStartApplication(COMPETITION_ID);

    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error starting application: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Application start success",
      applicationId: response?.data?.application_id,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to start application: ${message}`,
      },
      { status },
    );
  }
};
