"use client";

import { SearchResponseData } from "../api/SearchOpportunityAPI";
import { updateResults } from "./page";
import { useFormState } from "react-dom";

interface SearchFormProps {
  searchResults: SearchResponseData;
}

export function SearchForm({ searchResults }: SearchFormProps) {
  const [results, updateSearchResultAction] = useFormState(
    updateResults,
    searchResults,
  );
  console.log(results);
  return (
    <>
      <form action={updateSearchResultAction}>
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
