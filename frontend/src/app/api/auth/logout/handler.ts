// import { ApiRequestError, readError } from "src/errors";
// import { deleteSession } from "src/services/auth/sessionUtils";
// import { clearCorrelationId } from "src/services/correlationId/correlationId";
// import { postUserLogout } from "src/services/fetch/fetchers/fetchers";

// import { environment } from "src/constants/environments";

// import { redirect } from "next/navigation";
// import { NextRequest, NextResponse } from "next/server";

// export function logoutUser(_request: NextRequest): NextResponse {
//   if (!environment.AUTH_LOGOUT_URL) {
//     return new NextResponse("AUTH_LOGOUT_URL not defined", { status: 500 });
//   }
//   return redirect(environment.AUTH_LOGOUT_URL);
// }
// try {
//   // logout on API via /v1/users/token/logout
//   const response = await postUserLogout();
//   if (!response) {
//     throw new ApiRequestError("No logout response from API");
//   }
//   // delete session from current cookies
//   await deleteSession();

//   // Delete correlation_id on explicit logout only. Do not rotate
//   // correlation_id if the user is implicitly logged out such as through
//   // token expiration.
//   await clearCorrelationId("Clearing correlation_id on logout");
//   return NextResponse.json({ message: "logout success" });
// } catch (e) {
//   const { message, status, cause } = readError(e as Error, 500);
//   // if token expired, delete session and return 401
//   if (status === 401 && cause?.message === "Token expired") {
//     await deleteSession();
//     return NextResponse.json(
//       { message: "session previously expired" },
//       { status },
//     );
//   } else {
//     return NextResponse.json(
//       { message: `Error logging out: ${message}` },
//       { status },
//     );
//   }
// }
// }
