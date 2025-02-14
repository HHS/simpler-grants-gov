import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);
dayjs.extend(advancedFormat);

// Convert "2024-02-21" to "February 21, 2024"
export function formatDate(dateStr: string | null): string {
  if (!dateStr || !dayjs(dateStr).isValid()) {
    console.warn("invalid date string provided for parse");
    return "";
  }

  return dayjs(dateStr).format("LL");
}

export const getConfiguredDayJs = () => dayjs;
