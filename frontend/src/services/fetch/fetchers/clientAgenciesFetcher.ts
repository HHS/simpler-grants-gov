import { debounce } from "lodash";

// if we don't debounce this call we get multiple requests going out on page load
// not using clientFetch since we don't need to check the expiration here
// and also that'd create a circular dependency chain in the cilentFetch hook
export const debouncedAgencySearch = debounce(
  async (searchKeyword) => {
    const response = await fetch("/api/agencies", {
      method: "POST",
      body: JSON.stringify({
        keyword: searchKeyword,
      }),
    });
    if (response.ok && response.status === 200) {
      const data = await response.json();
      return data;
    }
    throw new Error(`Unable to fetch agencies search: ${response.status}`);
  },
  250,
  {
    leading: true,
    trailing: false,
  },
);
