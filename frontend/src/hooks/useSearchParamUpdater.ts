import { usePathname, useSearchParams } from "next/navigation";

export function useSearchParamUpdater() {
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";

  const updateSingularParam = (value: string, key: string) => {
    const params = new URLSearchParams(searchParams || {});

    if (value) {
      params.set(key, "QUERY_PLACEHOLDER");
    } else {
      params.delete(key);
    }

    let newPath = `${pathname}?${params.toString()}`;
    newPath = newPath.replace("QUERY_PLACEHOLDER", value);

    if (params.get("status")) {
      const statusCheckboxParams = params.get("status") || "";
      const encodedStatusCheckboxParams = statusCheckboxParams.replaceAll(
        ",",
        "%2C",
      );
      newPath = newPath.replace(
        encodedStatusCheckboxParams,
        statusCheckboxParams,
      );
    }

    window.history.pushState({}, "", newPath);
  };

  const updateMultipleParam = (selectedStatusesString: string, key: string) => {
    const params = new URLSearchParams(searchParams || {});
    const placeholder = "STATUS_PLACEHOLDER";

    if (selectedStatusesString) {
      params.set(key, placeholder);
    } else {
      params.delete(key);
    }

    let newPath = `${pathname}?${params.toString()}`;

    // replace the placeholder with the comma separated string of statuses
    newPath = newPath.replace(placeholder, selectedStatusesString);

    window.history.pushState({}, "", newPath);
  };
  return {
    updateSingularParam,
    updateMultipleParam,
  };
}
