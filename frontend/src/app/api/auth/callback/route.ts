import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    const errorMessage = request.nextUrl.searchParams.get("error_description");
    if (
      errorMessage === "Agency users must authenticate using a PIV/CAC card"
    ) {
      return redirect("/login?piverror=true");
    }
    return redirect("/unauthenticated");
  }
  try {
    await createSession(token, newExpirationDate());
  } catch (_e) {
    console.error("Error creating session for token", { token });
    console.error(_e);
    return redirect("/error");
  }
  return redirect("/login");
}
