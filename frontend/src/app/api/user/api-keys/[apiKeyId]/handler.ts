import {
  ApiRequestError,
  BadRequestError,
  readError,
  UnauthorizedError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleRenameApiKey } from "src/services/fetch/fetchers/apiKeyFetcher";
import { OptionalStringDict } from "src/types/generalTypes";

export const renameApiKeyHandler = async (
  request: Request,
  { params }: { params: Promise<{ apiKeyId: string }> },
) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to rename API key");
    }

    const { apiKeyId } = await params;

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
