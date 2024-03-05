// Disable rule to allow server actions to be called without warning
/* eslint-disable react/jsx-no-bind, @typescript-eslint/no-misused-promises */
import React, { Suspense } from "react";

import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import Loading from "./loading";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
import { fetchSearchOpportunities } from "../../services/searchfetcher/SearchFetcher";
import { revalidatePath } from "next/cache";

const useMockData = false;
const searchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

async function SearchResults() {
  const results = await fetchSearchOpportunities(searchFetcher);
  return (
    <ul>
      {results.map((opportunity) => (
        <li key={opportunity.opportunity_id}>
          {opportunity.category}, {opportunity.opportunity_title}
        </li>
      ))}
    </ul>
  );
}

export default function Search() {
  async function updateResults(formData: FormData) {
    // server action
    "use server";
    console.log(Object.fromEntries(formData.entries()));
    await new Promise((resolve) => setTimeout(resolve, 750));
    revalidatePath("/search");
  }

  
  return (
    <>
      <form action={updateResults}>
        <input type="text" name="mytext" />
        <input type="checkbox" name="mycheckbox" />
        <input type="hidden" name="hiddeninput" value={22} />
        <select name="mydropdown" id="alphabet">
          <option value="a">a</option>
          <option value="b">b</option>
        </select>
        <input type="submit" />
      </form>

      {/* Allow for partial pre-rendering while doing the initial data fetch */}
      <Suspense fallback={<Loading />}>
        <SearchResults />
      </Suspense>
    </>
  );
}
