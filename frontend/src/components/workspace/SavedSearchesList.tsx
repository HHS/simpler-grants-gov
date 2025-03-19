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
          <div className="border-1px border-base-lighter padding-x-2 padding-y-105 margin-bottom-2 text-base-darker desktop:grid-col-fill">
            <div className="grid-row padding-right-2">
              <div className="tablet:grid-col-8 grid-col-6">
                <h2 className="margin-y-105 line-height-sans-2">
                  <Link
                    href={`/search${queryParamsToQueryString(savedSearch.searchParams)}savedSearch=${savedSearch.id}`}
                    className="margin-right-05"
                  >
                    {savedSearch.name}
                  </Link>
                  <USWDSIcon name="search" />
                </h2>
              </div>
              <div className="grid-col margin-top-2 text-right">
                <div className="grid-row">
                  <div className="grid-col">
                    <EditSavedSearchModal
                      savedSearchId={savedSearch.id}
                      editText={editText}
                    />
                  </div>
                  <div className="grid-col">
                    <DeleteSavedSearchModal
                      savedSearchId={savedSearch.id}
                      deleteText={deleteText}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid-row flex-column">
              <div>
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
