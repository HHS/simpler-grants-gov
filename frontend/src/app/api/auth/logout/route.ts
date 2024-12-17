import { postLogout } from "src/app/api/userFetcher";
import { deleteSession, getSession } from "src/services/auth/session";

export async function POST() {
  try {
    // logout on API via /v1/users/token/logout
    const session = await getSession();
    if (!session || !session.token) {
      throw new Error("No active session to logout");
    }
    const response = await postLogout(session.token);
    if (!response) {
      throw new Error("No logout response from API");
    }
    // delete session from current cookies
    deleteSession();
    return Response.json({ message: "logout success" });
  } catch (e) {
    const error = e as Error;
    return Response.json(
      { message: `Error logging out: ${error.message}` },
      { status: 500 },
    );
  }
}
