export type NameLike = {
  first_name: string | null | undefined;
  last_name: string | null | undefined;
  middle_name?: string | null | undefined;
};

export function formatFullName<T extends NameLike>(
  user: T | null | undefined,
): string {
  if (!user) return " ";

  const parts = [user.first_name, user.middle_name, user.last_name].filter(
    Boolean,
  );

  return parts.join(" ");
}
