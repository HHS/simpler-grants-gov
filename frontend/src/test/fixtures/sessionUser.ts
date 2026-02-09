export type GetSession = typeof import("src/services/auth/session").getSession;

type SessionValue = Awaited<ReturnType<GetSession>>;
export type SessionUser = NonNullable<SessionValue>;

export const SESSION_USERS = {
  default: {
    user_id: "user-1",
    email: "user-1@example.com",
    first_name: "Test",
    last_name: "User",
    token: "fake-token",
    session_duration_minutes: 0,
  } satisfies SessionUser,

  // Example of another user
  otherUser: {
    user_id: "user-2",
    email: "user-2@example.com",
    first_name: "Other",
    last_name: "User",
    token: "fake-token-2",
    session_duration_minutes: 0,
  } satisfies SessionUser,
} as const;

export function buildSessionUser(
  overrides?: Partial<SessionUser>,
): SessionUser {
  return {
    ...SESSION_USERS.default,
    ...overrides,
  };
}
