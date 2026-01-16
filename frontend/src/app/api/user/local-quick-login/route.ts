import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";
import { environment } from "src/constants/environments";

export async function GET(request: NextRequest) {
  // Only allow in local/dev environments
  if (environment.ENVIRONMENT !== "local" && environment.ENVIRONMENT !== "dev") {
    return redirect("/unauthenticated");
  }

  let jwt = request.nextUrl.searchParams.get("jwt");
  if (!jwt) return redirect("/unauthenticated");
  
  // Strip potential quotes from token
  jwt = jwt.replace(/^["']|["']$/g, '').trim();

  try {
    await createSession(jwt, newExpirationDate());
  } catch (e) {
    console.error("Pa11y Login Session Failure:", e);
    return redirect("/error");
  }

  return redirect("/login");
}

export async function POST(request: NextRequest) {
  const { jwt } = (await request.json()) as { jwt: string };
  if (!jwt) {
    return redirect("/unauthenticated");
  }
  try {
    await createSession(jwt, newExpirationDate());
  } catch (_e) {
    return redirect("/error");
  }
}