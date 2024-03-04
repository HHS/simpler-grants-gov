"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SearchResponseData } from "../api/SearchOpportunityAPI";
import { updateResults } from "./actions";

export function SubmitButton() {
  "use client";
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? "Searching..." : "Search"}
    </button>
  );
}

interface SearchFormProps {
  initialSearchResults: SearchResponseData;
}

export function SearchForm({ initialSearchResults }: SearchFormProps) {
  const [results, updateSearchResultAction] = useFormState(
    updateResults,
    initialSearchResults,
  );
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
        <SubmitButton />
      </form>
      <ul>
        {results.map((opportunity) => (
          <li key={opportunity.opportunity_id}>
            {opportunity.category}, {opportunity.opportunity_title}
          </li>
        ))}
      </ul>
    </>
  );
}
