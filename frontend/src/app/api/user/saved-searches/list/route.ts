import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchSavedSearches } from "src/services/fetch/fetchers/savedSearchFetcher";

// this could be a GET, but eventually we may want to pass pagination info in the body rather than hard coding
export const POST = async (_request: Request) => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError(
        "No active session to fetch saved opportunities",
      );
    }

    const savedSearches = await fetchSavedSearches(
      session.token,
      session.user_id,
    );

    return new Response(JSON.stringify(savedSearches), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch saved searches: ${message}`,
      },
      { status },
    );
  }
};
