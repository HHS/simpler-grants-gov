import { QueryParamData } from "./searchfetcher/SearchFetcher";
import { SearchFetcherActionType } from "../../types/search/searchRequestTypes";

export class FormDataService {
  formData: FormData;

  constructor(formData: FormData) {
    this.formData = formData;
  }

  // Processes formData entries and returns a searchProps
  // object to get updated results
  processFormData() {
    const searchProps: QueryParamData = {
      page: this.page,
      status: this.status,
      fundingInstrument: this.fundingInstrument,
      eligibility: this.eligibility,
      agency: this.agency,
      category: this.category,
      query: this.query,
      sortby: this.sortBy,

      // This is currently only called from the server action
      // (marked as Update for updating results, not the initial load)
      actionType: SearchFetcherActionType.Update,
      fieldChanged: this.fieldChanged,
    };

    return searchProps;
  }

  getFormDataWithValue(value: string) {
    return this.formData.get(value);
  }

  // Required to have a page value, even if not set with query params
  // Default to 1
  get page(): number {
    const pageValue = this.getFormDataWithValue("currentPage");
    const page = pageValue ? parseInt(pageValue as string, 10) : 1;
    return !isNaN(page) && page > 0 ? page : 1;
  }

  get query(): string | null | undefined {
    const queryValue = this.getFormDataWithValue("query");
    return queryValue !== "" ? queryValue?.toString() : null;
  }

  getValuesByKeyPrefix(prefix: string, splitAtSecondPart = false): Set<string> {
    const values = new Set<string>();

    for (const [key] of this.formData.entries()) {
      if (key.startsWith(prefix)) {
        // Determine the index to split at, which is 1 by default,
        // but 2 if we're looking at 'funding-instrument-'.
        const indexToSplit = splitAtSecondPart ? 2 : 1;
        const value = key.split("-").slice(indexToSplit).join();

        if (value) {
          values.add(value);
        }
      }
    }

    return values;
  }

  get status(): Set<string> {
    return this.getValuesByKeyPrefix("status-");
  }

  get fundingInstrument(): Set<string> {
    // Pass 'true' to handle the special case of splitting 'funding-instrument-'after the second dash
    return this.getValuesByKeyPrefix("funding-instrument-", true);
  }

  get eligibility(): Set<string> {
    return this.getValuesByKeyPrefix("eligibility-");
  }

  get agency(): Set<string> {
    return this.getValuesByKeyPrefix("agency-");
  }

  get category(): Set<string> {
    return this.getValuesByKeyPrefix("category-");
  }

  get sortBy(): string | null {
    const sortByValue = this.getFormDataWithValue("search-sort-by");
    return sortByValue as string | null;
  }

  get fieldChanged(): string {
    return (this.getFormDataWithValue("fieldChanged") as string) || "";
  }
}
