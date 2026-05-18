import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { jwt } = (await request.json()) as { jwt: string };
  if (!jwt) {
    return NextResponse.json({ error: "No JWT provided" }, { status: 400 });
  }
  try {
    await createSession(jwt, newExpirationDate());
  } catch (_e) {
    console.error("Error creating session for token", { jwt });
    console.error(_e);
    return NextResponse.json(
      { error: "Error creating session" },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
