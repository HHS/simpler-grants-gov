import {
  FilterOption,
  HardcodedFrontendFilterNames,
} from "src/types/search/searchFilterTypes";
import {
  ValidSearchQueryParam,
  ValidSearchQueryParamData,
} from "src/types/search/searchQueryTypes";
import { queryParamsToQueryString } from "src/utils/generalUtils";
import {
  getFilterOptionLabel,
  optionsForSearchParamKey,
} from "src/utils/search/filterUtils";

import Link from "next/link";

import { USWDSIcon } from "src/components/USWDSIcon";
import { DeleteSavedSearchModal } from "src/components/workspace/DeleteSavedSearchModal";
import { EditSavedSearchModal } from "src/components/workspace/EditSavedSearchModal";

type ParamMapping = { [key in ValidSearchQueryParam]: string };

const toSavedSearchFilterDisplayValues = (
  mapping: ParamMapping,
  backendFilterValues: ValidSearchQueryParamData,
  agencyOptions: FilterOption[],
): { [filterKey: string]: string } => {
  return Object.entries(mapping).reduce(
    (acc, [key, paramDisplay]) => {
      const value = backendFilterValues[key as ValidSearchQueryParam];
      if (!value || key === "page") {
        return acc;
      }
      let displayValue = "";
      if (key === "query" || key === "andOr") {
        displayValue = value;
      } else {
        // might get a number here
        const rawValues = value?.toString().split(",");
        const displayOptions = optionsForSearchParamKey(
          key as HardcodedFrontendFilterNames,
          agencyOptions,
        );
        const displayValues = rawValues?.map((value) =>
          getFilterOptionLabel(value, displayOptions),
        );
        displayValue = displayValues.join(", ");
      }
      acc[paramDisplay] = displayValue;
      return acc;
    },
    {} as { [filterKey: string]: string },
  );
};

export const SavedSearchesList = ({
  savedSearches,
  paramDisplayMapping,
  editText,
  deleteText,
  agencyOptions,
}: {
  savedSearches: {
    name: string;
    id: string;
    searchParams: ValidSearchQueryParamData;
  }[];
  paramDisplayMapping: ParamMapping;
  editText: string;
  deleteText: string;
  agencyOptions: FilterOption[];
}) => {
  return (
    <ul className="usa-list--unstyled grid-container">
      {savedSearches.map((savedSearch) => (
        <li key={savedSearch.id}>
          <div className="border-1px border-base-lighter padding-x-2 padding-y-105 margin-bottom-2 text-base-darker desktop:grid-col-fill">
            <div className="grid-row padding-right-2">
              <div className="tablet:grid-col-8 grid-col-6">
                <h2 className="margin-y-105 font-sans-lg">
                  <Link
                    href={`/search${queryParamsToQueryString(savedSearch.searchParams)}savedSearch=${savedSearch.id}`}
                    className="margin-right-05"
                  >
                    <USWDSIcon
                      name="search"
                      className="usa-icon--size-3 text-middle text-primary-dark margin-right-1"
                    />
                    {savedSearch.name}
                  </Link>
                </h2>
              </div>
              <div className="grid-col margin-top-2 text-right">
                <div className="grid-row">
                  <div className="grid-col">
                    <EditSavedSearchModal
                      savedSearchId={savedSearch.id}
                      editText={editText}
                      queryName={savedSearch.name}
                    />
                  </div>
                  <div className="grid-col">
                    <DeleteSavedSearchModal
                      savedSearchId={savedSearch.id}
                      deleteText={deleteText}
                      queryName={savedSearch.name}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className="grid-row flex-column"
              data-testid="saved-search-definition"
            >
              {Object.entries(
                toSavedSearchFilterDisplayValues(
                  paramDisplayMapping,
                  savedSearch.searchParams,
                  agencyOptions,
                ),
              ).map(([key, value]) => {
                return (
                  <div key={key}>
                    <span className="text-bold">{key}: </span>
                    <span>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
