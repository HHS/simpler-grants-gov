import { environment } from "src/constants/environments";

export function assetPath(relativePath: string) {
  const basePath = environment.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${relativePath}`;
}
