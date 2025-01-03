import { environment } from "src/constants/environments";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    api_url: environment.API_URL,
    auth_login_url: environment.AUTH_LOGIN_URL,
    node_env: environment.NODE_ENV,
  });
}
