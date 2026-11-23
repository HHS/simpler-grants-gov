import {
  MAX_SESSION_DURATION_OVERRIDE_SECONDS,
  MIN_SESSION_DURATION_OVERRIDE_SECONDS,
  SESSION_DURATION_OVERRIDE_ENVIRONMENTS,
} from "src/constants/auth";
import { environment } from "src/constants/environments";

export const isSessionDurationOverrideAllowed = (): boolean =>
  SESSION_DURATION_OVERRIDE_ENVIRONMENTS.includes(environment.ENVIRONMENT);

export const parseSessionDurationOverride = (
  value?: string | number | null,
): number | undefined => {
  if (value === undefined || value === null || value === "") return;
  if (!isSessionDurationOverrideAllowed()) return;
  if (typeof value === "string" && !/^\d+$/.test(value)) return;
  const seconds = Number(value);
  if (
    !Number.isInteger(seconds) ||
    seconds < MIN_SESSION_DURATION_OVERRIDE_SECONDS ||
    seconds > MAX_SESSION_DURATION_OVERRIDE_SECONDS
  ) {
    return;
  }
  return seconds;
};
