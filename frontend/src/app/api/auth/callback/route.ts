import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirect("/unauthenticated");
  }
  try {
    await createSession(token, newExpirationDate());
  } catch (_e) {
    if (_e instanceof Error && _e.message === "PIV Required") {
      return redirect("/login?piverror=true");
    }
    console.error("Error creating session for token", { token });
    console.error(_e);
    return redirect("/error");
  }
  return redirect("/login");
}
