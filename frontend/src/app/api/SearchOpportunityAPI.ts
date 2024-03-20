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

    return response;
  }

  // Build to one_of syntax
  private buildFilters(
    searchInputs: SearchFetcherProps,
  ): SearchFilterRequestBody {
    const { agency, status, fundingInstrument } = searchInputs;
    const filters: SearchFilterRequestBody = {};

    if (agency && agency.size > 0) {
      filters.agency = { one_of: Array.from(agency) };
    }

    if (status && status.size > 0) {
      filters.opportunity_status = { one_of: Array.from(status) };
    }

    if (fundingInstrument && fundingInstrument.size > 0) {
      filters.funding_instrument = { one_of: Array.from(fundingInstrument) };
    }

    return filters;
  }

  private buildPagination(
    searchInputs: SearchFetcherProps,
  ): PaginationRequestBody {
    const { sortby, page, fieldChanged } = searchInputs;

    // When performing an update (query, filter, sortby change) - we want to
    // start back at the 1st page (we never want to retain the current page).
    // In addition to resetting to 1 here, we need to do some work on the client
    // as well (update query param, update current page to 1 in the SearhcPagination
    // component.
    // On initial load (SearchFetcherActionType.InitialLoad) we just use the page sent, since
    // we want to honor the initial query param page chosen. There is validation guards
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
