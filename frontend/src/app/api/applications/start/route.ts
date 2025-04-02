import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { handleStartApplication } from "src/services/fetch/fetchers/applicationFetcher";

const COMPETITION_ID = "fd7f5921-9585-48a5-ab0f-e726f4d1ef94";

export const POST = async () => {
  try {
    // TODO: add session support;
    const session = { token: true };
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session start application");
    }
    console.log("heeey");

    const response = await handleStartApplication(COMPETITION_ID);
    console.log(response);
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error starting application: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    return Response.json({
      message: "Application start success",
      id: response?.competition_id,
    });
  } catch (e) {
    console.log("heee", e);
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to start application: ${message}`,
      },
      { status },
    );
  }
};
