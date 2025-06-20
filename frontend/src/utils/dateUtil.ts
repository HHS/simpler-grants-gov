import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import { clientTokenRefreshInterval } from "src/constants/auth";

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);

// Convert "2024-02-21" to "February 21, 2024"
export function formatDate(dateStr: string | null): string {
  if (!dateStr || !dayjs(dateStr, "YYYY-MM-DD", true).isValid()) {
    console.warn("invalid date string provided for parse");
    return "";
  }

  return dayjs(dateStr).format("LL");
}

// "2025-01-15" -> "Jan 15, 2025"
export const toShortMonthDate = (unformattedDate: string): string => {
  return dayjs(unformattedDate).format("MMM D, YYYY");
};

export const getConfiguredDayJs = () => dayjs;

export const isExpired = (expiration?: number) =>
  !!expiration && expiration < Date.now();

// is a token less than 10 minutes from expiring?
export const isExpiring = (expiration?: number) =>
  !isExpired(expiration) &&
  !!expiration &&
  expiration < Date.now() + clientTokenRefreshInterval;
