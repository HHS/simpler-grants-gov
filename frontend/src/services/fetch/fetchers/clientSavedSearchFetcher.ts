import { filterSearchParams } from "src/utils/search/searchFormatUtils";

import { ReadonlyURLSearchParams } from "next/navigation";

// make call from client to Next server to initiate saving a search
export const saveSearch = async (
  name: string,
  searchParams: ReadonlyURLSearchParams,
  token?: string,
) => {
  if (!token) return;
  // send up a filtered set of params, converted to an object
  // we will do the further filter and pagination object building on the server
  const savedSearchParams = filterSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const res = await fetch("/api/user/saved-searches", {
    method: "POST",
    body: JSON.stringify({ ...savedSearchParams, name }),
  });
  if (res.ok && res.status === 200) {
    const data = (await res.json()) as { type: string };
    return data;
  } else {
    throw new Error(`Error posting saved search: ${res.status}`);
  }
};
