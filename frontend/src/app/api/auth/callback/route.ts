import { createSession } from "src/services/auth/session";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirect("/unauthorized");
  }
  try {
    await createSession(token);
  } catch (_e) {
    return redirect("/error");
  }
  return redirect("/");
}
