import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";
import { logger } from "src/services/logger/simplerLogger";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { jwt } = (await request.json()) as { jwt: string };
  if (!jwt) {
    return redirect("/unauthenticated");
  }
  try {
    await createSession(jwt, newExpirationDate());
  } catch (e) {
    logger.error({ err: e }, "Error creating local quick login session");
    return redirect("/error");
  }
  return redirect("/login");
}
