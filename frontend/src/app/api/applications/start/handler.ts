import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleStartApplication } from "src/services/fetch/fetchers/applicationFetcher";

export const startApplicationHandler = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session start application");
    }
    const { competitionId, applicationName, organization } =
      (await request.json()) as {
        competitionId: string;
        applicationName: string;
        organization?: string;
      };

    const response = await handleStartApplication(
      applicationName,
      competitionId,
      session.token,
      organization,
    );

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
