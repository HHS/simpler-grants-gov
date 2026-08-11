import { deleteSession } from "src/services/auth/sessionUtils";
import { clearCorrelationId } from "src/services/correlationId/correlationId";

import { redirect } from "next/navigation";

export async function GET() {
  try {
    await deleteSession();

    // Delete correlation_id on explicit logout only. Do not rotate
    // correlation_id if the user is implicitly logged out such as through
    // token expiration.
    await clearCorrelationId("Clearing correlation_id on logout");
  } catch (_e) {
    console.error("Error deleting session");
    console.error(_e);
    return redirect("/error");
  }
  return redirect("/logout");
}
