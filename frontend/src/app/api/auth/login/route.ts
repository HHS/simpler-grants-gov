import { environment } from "src/constants/environments";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    if (!environment.AUTH_LOGIN_URL) {
      throw new Error("AUTH_LOGIN_URL not defined");
    }
    return NextResponse.redirect(environment.AUTH_LOGIN_URL);
  } catch (error) {
    return new NextResponse(error as string, { status: 500 });
  }
}
