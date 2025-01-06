import { getSession } from "src/services/auth/session";

import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
  const currentSession = await getSession();
  console.log("~~~ session got", currentSession);
  if (currentSession) {
    return NextResponse.json(currentSession);
  } else {
    return NextResponse.json({ token: "" });
  }
}
