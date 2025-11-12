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

  const cacheBuster = generateCacheBuster();
  const separator = urlWithoutHash.includes("?") ? "&" : "?";
  return `${urlWithoutHash}${separator}_cb=${cacheBuster}${hashFragment}`;
}
