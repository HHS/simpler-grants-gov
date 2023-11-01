export function assetPath(relativePath: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${relativePath}`;
}
