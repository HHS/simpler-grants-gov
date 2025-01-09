import { createSession } from "src/services/auth/session";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// in Next 15 there is an experimantal `unauthorized` function that will send a 401
// code to the client and display an unauthorized page
// see https://nextjs.org/docs/app/api-reference/functions/unauthorized
// For now there is no way that I can see to get a 400 code to the user in these cases,
// and have the client render the app
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
