// Stand-in for `next/navigation` when frontend components render outside Next.
const router = {
  push: () => undefined,
  replace: () => undefined,
  refresh: () => undefined,
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
};

export const useRouter = () => router;
export const useParams = () => ({});
export const usePathname = () =>
  typeof window === "undefined" ? "/" : window.location.pathname;
export const useSearchParams = () =>
  new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
