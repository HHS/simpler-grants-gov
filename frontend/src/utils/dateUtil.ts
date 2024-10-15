// Convert "2024-02-21" to "February 21, 2024"
export function formatDate(dateStr: string | null) {
  if (dateStr === "" || dateStr === null) {
    return "";
  }

  const [year, month, day] = dateStr.split("-").map(Number);

  // Create a new Date object using the local time
  const date = new Date(year, month - 1, day);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}
