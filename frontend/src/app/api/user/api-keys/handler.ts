import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleCreateApiKey } from "src/services/fetch/fetchers/apiKeyFetcher";
import { OptionalStringDict } from "src/types/generalTypes";

export const createApiKeyHandler = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to create API key");
    }

    const apiKeyBody = (await request.json()) as OptionalStringDict;

    if (!apiKeyBody.key_name) {
      throw new BadRequestError("No key name supplied for API key");
    }

    const response = await handleCreateApiKey(
      session.token,
      session.user_id,
      apiKeyBody.key_name,
    );

    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error creating API key: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }

    return Response.json({
      message: "API key created successfully",
      data: response.data,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to create API key: ${message}`,
      },
      { status },
    );
  }
};
