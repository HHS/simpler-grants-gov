export type GetSession = typeof import("src/services/auth/session").getSession;
export type SessionUser = NonNullable<SessionValue>;

type SessionValue = Awaited<ReturnType<GetSession>>;

export function buildSessionUser(
  overrides?: Partial<SessionUser>,
): SessionUser {
  return {
    user_id: "user-1",
    email: "user-1@example.com",
    first_name: "Test",
    last_name: "User",
    token: "fake-token",
    session_duration_minutes: 0,
    ...overrides,
  };
}
