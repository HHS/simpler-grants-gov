import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getUserDetails } from "src/services/fetch/fetchers/userFetcher";

export const getUserDetailsHandler = async (): Promise<Response> => {
  try {
    const session = await getSession();
    if (!session || !session.token || !session.user_id) {
      throw new UnauthorizedError("No active session");
    }

    const userDetails = await getUserDetails(session.token, session.user_id);
    return Response.json({ data: userDetails });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch user details: ${message}`,
      },
      { status },
    );
  }
};
