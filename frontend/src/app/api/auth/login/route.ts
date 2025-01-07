import { environment } from "src/constants/environments";

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export function GET() {
  if (environment.AUTH_LOGIN_URL) {
    return redirect(environment.AUTH_LOGIN_URL);
  }
  else {
    throw new Error("Could not access AUTH_LOGIN_URL");
  }
}
