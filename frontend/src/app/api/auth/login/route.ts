import { environment } from "src/constants/environments";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  if (!environment.AUTH_LOGIN_URL) {
    return new NextResponse("AUTH_LOGIN_URL not defined", { status: 500 });
  }
  redirect(environment.AUTH_LOGIN_URL);
}
