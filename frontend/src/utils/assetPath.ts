import { environment } from "src/constants/environments";

export function assetPath(relativePath: string) {
  return `${environment.NEXT_PUBLIC_BASE_PATH}${relativePath}`;
}
