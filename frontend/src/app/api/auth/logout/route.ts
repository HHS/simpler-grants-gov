import { environment } from "src/constants/environments";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export function GET(_request: NextRequest): NextResponse {
  if (!environment.AUTH_LOGOUT_URL) {
    return new NextResponse("AUTH_LOGOUT_URL not defined", { status: 500 });
  }
  return redirect(environment.AUTH_LOGOUT_URL);
}
