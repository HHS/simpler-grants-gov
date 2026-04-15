import { environment } from "src/constants/environments";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  if (!environment.AUTH_LOGIN_URL) {
    return new NextResponse("AUTH_LOGIN_URL not defined", { status: 500 });
  }
  const pivRequired = request.nextUrl.searchParams.get("piv_required");
  redirect(
    `${environment.AUTH_LOGIN_URL}${pivRequired === "true" ? "piv_required=True" : ""}`,
  );
}
