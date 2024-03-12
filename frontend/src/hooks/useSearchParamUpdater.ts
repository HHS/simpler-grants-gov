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

    // TODO - expand this to other filters as they are built,
    // such as agency and funding instrument,
    // so we retain commas instead of %2C in the URL
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

  const updateMultipleParam = (selectedSet: Set<string>, key: string) => {
    const commaSeparatedSelections = Array.from(selectedSet).join(",");
    const params = new URLSearchParams(searchParams || {});
    const placeholder = "a_placeholder";

    if (commaSeparatedSelections) {
      params.set(key, placeholder);
    } else {
      params.delete(key);
    }

    let newPath = `${pathname}?${params.toString()}`;

    // replace the placeholder with the comma separated string of statuses
    newPath = newPath.replace(placeholder, commaSeparatedSelections);

    window.history.pushState({}, "", newPath);
  };
  return {
    updateSingularParam,
    updateMultipleParam,
  };
}
