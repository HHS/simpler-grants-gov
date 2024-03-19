import "server-only";

import {
  PaginationRequestBody,
  SearchFilterRequestBody,
  SearchRequestBody,
} from "../../types/search/searchRequestTypes";

import BaseApi from "./BaseApi";
import { SearchFetcherProps } from "../../services/searchfetcher/SearchFetcher";

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

    console.log("request Boyd => ", requestBody);
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
    const { sortby, page } = searchInputs;
    return {
      //   order_by: sortby || "opportunity_id",
      order_by: "opportunity_id",
      page_offset: page,
      page_size: 25,
      sort_direction: sortby?.endsWith("Desc") ? "descending" : "ascending", // ensure string literal is returned
    };
  }
}
