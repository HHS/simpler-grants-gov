import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";

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

export const getConfiguredDayJs = () => dayjs;
