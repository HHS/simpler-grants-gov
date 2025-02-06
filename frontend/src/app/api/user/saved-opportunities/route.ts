import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { handleSavedOpportunity } from "src/services/fetch/fetchers/savedOpportunityFetcher";

export const POST = async (request: Request) => {
  return await handleRequest(request, "POST");
};

export const DELETE = async (request: Request) => {
  return await handleRequest(request, "DELETE");
};

const handleRequest = async (request: Request, type: "DELETE" | "POST") => {
  const headers = request.headers;
  const opportunity_id = headers.get("opportunity_id");
  const action = type === "POST" ? "save" : "delete";

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new Error("No active session to save opportunity");
    }
    const response = await handleSavedOpportunity(
      type,
      session.token,
      session.user_id as string,
      Number(opportunity_id),
    );
    const res = (await response.json()) as {
      status_code: number;
      message: string;
    };
    if (!res || res.status_code !== 200) {
      throw new Error(`Error ${action} saved opportunity: ${res.message}`);
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
