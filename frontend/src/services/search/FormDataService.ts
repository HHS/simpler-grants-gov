import { SearchFetcherProps } from "../../services/searchfetcher/SearchFetcher";

export class FormDataService {
  formData: FormData;

  constructor(formData: FormData) {
    this.formData = formData;
  }

  // Processes formData entries and returns a searchProps
  // object to get updated results
  processFormData() {
    const searchProps: SearchFetcherProps = {
      page: this.page,
      status: this.status,
      fundingInstrument: this.fundingInstrument,
      agency: this.agency,
      query: this.query,
      sortby: this.sortBy,
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

  // Builds a set of selected status values from the formData
  get status(): Set<string> {
    const statuses = new Set<string>();
    const statusKeys = [
      "status-forecasted",
      "status-posted",
      "status-closed",
      "status-archived",
    ];

    for (const key of statusKeys) {
      const value = this.getFormDataWithValue(key);
      if (value !== null) {
        statuses.add(key.split("-")[1]); // Add the part after 'status-', e.g., 'forecasted'
      }
    }
    return statuses;
  }

  // Getting a set of selected funding instruments
  get fundingInstrument(): Set<string> {
    const fundingInstruments = new Set<string>();

    const fundingInstrumentTypes = [
      "funding-instrument-cooperative_agreement",
      "funding-instrument-grant",
      "funding-instrument-procurement_contract",
      "funding-instrument-other",
    ];

    for (const key of fundingInstrumentTypes) {
      const value = this.getFormDataWithValue(key);
      if (value !== null) {
        // Extracting the part after 'funding-instrument-', e.g., 'grant'
        const instrument = key.split("-")[2];
        if (instrument) {
          fundingInstruments.add(instrument);
        }
      }
    }

    return fundingInstruments;
  }

  get agency(): Set<string> {
    const agencies = new Set<string>();

    // Iterate over all entries in the FormData
    for (const [key] of this.formData.entries()) {
      if (key.startsWith("agency-")) {
        // Remove the initial 'agency-' prefix and add the remainder to the set
        const agencyId = key.substring("agency-".length);
        if (agencyId) {
          agencies.add(agencyId);
        }
      }
    }

    return agencies;
  }

  get sortBy(): string | null {
    const sortByValue = this.getFormDataWithValue("search-sort-by");
    return sortByValue as string | null;
  }
}
