import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import {
  handleCreateApiKey,
  handleRenameApiKey,
} from "src/services/fetch/fetchers/apiKeyFetcher";
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

export const renameApiKeyHandler = async (request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to rename API key");
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const apiKeyId = pathSegments[pathSegments.length - 1];

    if (!apiKeyId) {
      throw new BadRequestError("No API key ID provided");
    }

    const apiKeyBody = (await request.json()) as OptionalStringDict;

    if (!apiKeyBody.key_name) {
      throw new BadRequestError("No key name supplied for API key");
    }

    const response = await handleRenameApiKey(
      session.token,
      session.user_id,
      apiKeyId,
      apiKeyBody.key_name,
    );
    
    if (!response || response.status_code !== 200) {
      throw new ApiRequestError(
        `Error renaming API key: ${response.message}`,
        "APIRequestError",
        response.status_code,
      );
    }
    
    return Response.json({
      message: "API key renamed successfully",
      data: response.data,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to rename API key: ${message}`,
      },
      { status },
    );
  }
};
