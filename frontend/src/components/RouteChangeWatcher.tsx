import { useRouteChange } from "src/hooks/useRouteChange";
import { useUser } from "src/services/auth/useUser";

// this is isolated in its own component because next was adamant that anything using
// useSearchParams needs to be wrapped in a suspense boundary
export const RouteChangeWatcher = () => {
  const { refreshIfExpired } = useUser();
  // check if the current user is still logged in on every route change
  useRouteChange(async () => {
    await refreshIfExpired();
  });
  return <></>;
};
