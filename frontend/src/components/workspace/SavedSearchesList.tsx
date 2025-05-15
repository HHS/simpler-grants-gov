import { omit } from "lodash";
import { ValidSearchQueryParamData } from "src/types/search/searchRequestTypes";
import { ValidSearchQueryParam } from "src/types/search/searchResponseTypes";
import { queryParamsToQueryString } from "src/utils/generalUtils";

import Link from "next/link";

import { USWDSIcon } from "src/components/USWDSIcon";
import { DeleteSavedSearchModal } from "src/components/workspace/DeleteSavedSearchModal";
import { EditSavedSearchModal } from "src/components/workspace/EditSavedSearchModal";

export const SavedSearchesList = ({
  savedSearches,
  paramDisplayMapping,
  editText,
  deleteText,
}: {
  savedSearches: {
    name: string;
    id: string;
    searchParams: ValidSearchQueryParamData;
  }[];
  paramDisplayMapping: { [key in ValidSearchQueryParam]: string };
  editText: string;
  deleteText: string;
}) => {
  return (
    <ul className="usa-prose usa-list--unstyled grid-container">
      {savedSearches.map((savedSearch) => (
        <li key={savedSearch.id}>
          <div className="grid-col grid-gap-1 border-1px border-base-lighter margin-bottom-2 padding-2 text-base-darker desktop:grid-col-fill">
            <div className="grid-row">
              <USWDSIcon
                name="search"
                className="usa-icon--size-3 text-mint-50 flex-align-self-center margin-right-1"
              />
              <Link
                href={`/search${queryParamsToQueryString(savedSearch.searchParams)}savedSearch=${savedSearch.id}`}
                className="font-sans-lg text-bold grid-col-fill margin-right-10"
              >
                {savedSearch.name}
              </Link>
              <div className="grid-col-auto">
                <EditSavedSearchModal
                  savedSearchId={savedSearch.id}
                  editText={editText}
                  queryName={savedSearch.name}
                />
                <DeleteSavedSearchModal
                  savedSearchId={savedSearch.id}
                  deleteText={deleteText}
                  queryName={savedSearch.name}
                />
              </div>
            </div>
            <div className="grid-row">
              <div
                className="grid-row flex-column"
                data-testid="saved-search-definition"
              >
                {Object.entries(omit(paramDisplayMapping, "page")).map(
                  ([key, paramDisplay]) => {
                    const value =
                      savedSearch.searchParams[key as ValidSearchQueryParam];
                    return value ? (
                      <div key={key}>
                        <span className="text-bold">{paramDisplay}: </span>
                        <span>{value.replaceAll(",", ", ")}</span>
                      </div>
                    ) : null;
                  },
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
