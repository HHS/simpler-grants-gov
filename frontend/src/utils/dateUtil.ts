
// Convert "2024-02-21" to "February 21, 2024"
export function formatDate(dateStr: string | null) {
  if (dateStr === "" || dateStr === null) {
    return "";
  }
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}
