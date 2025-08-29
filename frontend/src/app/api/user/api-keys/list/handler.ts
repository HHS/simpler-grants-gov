import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleListApiKeys } from "src/services/fetch/fetchers/apiKeyFetcher";

export const listApiKeysHandler = async (_request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to list API keys");
    }

    const response = await handleListApiKeys(session.token, session.user_id);

    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error listing API keys: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }

    return Response.json({
      message: "API keys retrieved successfully",
      data: response.data,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to list API keys: ${message}`,
      },
      { status },
    );
  }
};
