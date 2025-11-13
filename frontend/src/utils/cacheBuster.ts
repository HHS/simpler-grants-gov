// Generate cache buster: epoch_ms + random suffix
export function generateCacheBuster(): string {
  const epochMs = Date.now();
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 10)
    .toLowerCase();
  return `${epochMs}_${randomSuffix}`;
}

// Add cache buster to URL
export function addCacheBuster(url: string): string {
  // Don't add cache buster to external URLs
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Split URL and hash fragment
  const hashIndex = url.indexOf("#");
  const hasHash = hashIndex !== -1;
  const urlWithoutHash = hasHash ? url.substring(0, hashIndex) : url;
  const hashFragment = hasHash ? url.substring(hashIndex) : "";

  // Parse URL to remove existing _cb parameters
  const [pathAndQuery, existingParams] = urlWithoutHash.split("?");
  const searchParams = new URLSearchParams(existingParams || "");

  // Remove all existing _cb parameters (there might be multiple due to bugs)
  searchParams.delete("_cb");

  // Add new cache buster
  const cacheBuster = generateCacheBuster();
  searchParams.set("_cb", cacheBuster);

  // Rebuild URL
  const queryString = searchParams.toString();
  return `${pathAndQuery}?${queryString}${hashFragment}`;
}
