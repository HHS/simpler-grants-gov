import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { jwt } = (await request.json()) as { jwt: string };
  if (!jwt) {
    return redirect("/unauthenticated");
  }
  try {
    await createSession(jwt, newExpirationDate());
  } catch (_e) {
    console.error("Error creating session for token", { jwt });
    console.error(_e);
    return redirect("/error");
  }
  return redirect("/login");
}
