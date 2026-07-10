import { useClientFetch } from "src/hooks/useClientFetch";
import type { UserOrganization } from "src/types/userTypes";

import { useEffect, useState } from "react";

type UseUserOrganizationsResult = {
  organizations: UserOrganization[];
  isLoading: boolean;
  hasError: boolean;
};

export function useUserOrganizations(): UseUserOrganizationsResult {
  const { clientFetch } = useClientFetch<UserOrganization[]>(
    "Error fetching organizations",
  );

  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganizations(): Promise<void> {
      setIsLoading(true);
      setHasError(false);

      try {
        const data = await clientFetch("/api/user/organizations", {
          method: "GET",
        });

        if (!isMounted) {
          return;
        }

        setOrganizations(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) {
          return;
        }

        setOrganizations([]);
        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrganizations().catch(() => {
      // errors are already handled in the hook;
      // this prevents unhandled promise warnings
    });

    return () => {
      isMounted = false;
    };
  }, [clientFetch]);

  return { organizations, isLoading, hasError };
}
