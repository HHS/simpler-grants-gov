import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleSavedOpportunity } from "src/services/fetch/fetchers/savedOpportunityFetcher";

export const POST = async (request: Request) => {
  return await handleRequest(request);
};

export const DELETE = async (request: Request) => {
  return await handleRequest(request);
};

const handleRequest = async (request: Request) => {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return Response.json(
      { message: `Method ${request.method} not allowed` },
      { status: 405 },
    );
  }
  const action = request.method === "POST" ? "save" : "delete";

  try {
    const { opportunityId } = (await request.json()) as {
      opportunityId: string;
    };
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to save opportunity");
    }
    const response = await handleSavedOpportunity(
      request.method,
      session.token,
      session.user_id as string,
      Number(opportunityId),
    );
    const res = (await response.json()) as {
      status_code: number;
      message: string;
    };
    if (!res || res.status_code !== 200) {
      throw new ApiRequestError(
        `Error ${request.method} saved opportunity: ${res.message}`,
        "APIRequestError",
        res.status_code,
      );
    }
    return Response.json({
      type: action,
      message: `${action} saved opportunity success`,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to ${action} saved opportunity: ${message}`,
      },
      { status },
    );
  }
};
