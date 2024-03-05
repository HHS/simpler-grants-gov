"use client";

import { SearchResponseData } from "../api/SearchOpportunityAPI";

interface SearchFormProps {
  searchResults: SearchResponseData;
}

export function SearchForm({ searchResults }: SearchFormProps) {
  // TODO: switch the searchform to a client component with useFormState,
  // retain code for future use

  //   const [results, updateSearchResultAction] = useFormState(
  //     updateResults,
  //     searchResults,
  //   );
  return (
    <>
      <form>
        <input type="text" name="mytext" />
        <input type="checkbox" name="mycheckbox" />
        <input type="hidden" name="hiddeninput" value={22} />
        <select name="mydropdown" id="dog-names">
          <option value="a">a</option>
          <option value="b">b</option>
          <option value="c">c</option>
        </select>
        <button type="submit" />
      </form>
      <ul>
        {searchResults.map((opportunity) => (
          <li key={opportunity.opportunity_id}>
            {opportunity.category}, {opportunity.opportunity_title}
          </li>
        ))}
      </ul>
    </>
  );
}
