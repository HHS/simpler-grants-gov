import { environment } from "src/constants/environments";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    auth_login_url: environment.AUTH_LOGIN_URL,
  });
}
