import "server-only";

import {
  PaginationOrderBy,
  PaginationRequestBody,
  PaginationSortDirection,
  SearchFetcherActionType,
  SearchFilterRequestBody,
  SearchRequestBody,
} from "../../types/search/searchRequestTypes";

import BaseApi from "./BaseApi";
import { SearchFetcherProps } from "../../services/search/searchfetcher/SearchFetcher";

export default class SearchOpportunityAPI extends BaseApi {
  get basePath(): string {
    return process.env.API_URL || "";
  }

  get namespace(): string {
    return "opportunities";
  }

  get headers() {
    const baseHeaders = super.headers;
    const searchHeaders = {};
    return { ...baseHeaders, ...searchHeaders };
  }

  async searchOpportunities(searchInputs: SearchFetcherProps) {
    const { query } = searchInputs;
    const filters = this.buildFilters(searchInputs);
    console.log("filters => ", filters);
    const pagination = this.buildPagination(searchInputs);

    const requestBody: SearchRequestBody = { pagination };

    // Only add filters if there are some
    if (Object.keys(filters).length > 0) {
      requestBody.filters = filters;
    }

    if (query) {
      requestBody.query = query;
    }

    console.log("request boyd => ", requestBody);

    const subPath = "search";
    const response = await this.request(
      "POST",
      this.basePath,
      this.namespace,
      subPath,
      requestBody,
    );

    console.log("response => ", response.data.length);
    return response;
  }

  // Build with one_of syntax
  private buildFilters(
    searchInputs: SearchFetcherProps,
  ): SearchFilterRequestBody {
    const { status, fundingInstrument, eligibility, agency, category } =
      searchInputs;
    const filters: SearchFilterRequestBody = {};

    if (status && status.size > 0) {
      filters.opportunity_status = { one_of: Array.from(status) };
    }
    if (fundingInstrument && fundingInstrument.size > 0) {
      filters.funding_instrument = { one_of: Array.from(fundingInstrument) };
    }

    if (eligibility && eligibility.size > 0) {
      filters.applicant_type = { one_of: Array.from(eligibility) };
    }

    if (agency && agency.size > 0) {
      filters.agency = { one_of: Array.from(agency) };
    }

    if (category && category.size > 0) {
      filters.funding_category = { one_of: Array.from(category) };
    }

    return filters;
  }

  private buildPagination(
    searchInputs: SearchFetcherProps,
  ): PaginationRequestBody {
    const { sortby, page, fieldChanged } = searchInputs;

    // When performing an update (query, filter, sortby change) - we want to
    // start back at the 1st page (we never want to retain the current page).
    // In addition to this statement - on the client (handleSubmit in useSearchFormState), we
    // clear the page query param and set the page back to 1.
    // On initial load (SearchFetcherActionType.InitialLoad) we honor the page the user sent. There is validation guards
    // in convertSearchParamstoProperTypes keep 1<= page <= max_possible_page
    const page_offset =
      searchInputs.actionType === SearchFetcherActionType.Update &&
      fieldChanged !== "pagination"
        ? 1
        : page;

    const orderByFieldLookup = {
      opportunityNumber: "opportunity_number",
      opportunityTitle: "opportunity_title",
      agency: "agency_code",
      postedDate: "post_date",
      closeDate: "close_date",
    };

    let order_by: PaginationOrderBy = "opportunity_id";
    if (sortby) {
      for (const [key, value] of Object.entries(orderByFieldLookup)) {
        if (sortby.startsWith(key)) {
          order_by = value as PaginationOrderBy;
          break; // Stop searching after the first match is found
        }
      }
    }

    const sort_direction: PaginationSortDirection = sortby?.endsWith("Desc")
      ? "descending"
      : "ascending";

    return {
      order_by,
      page_offset,
      page_size: 25,
      sort_direction,
    };
  }
}
