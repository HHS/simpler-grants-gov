import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import {
  Button,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SearchDrawerFilters } from "./SearchDrawerFilters";

export function SearchFilterDrawer({
  drawerId,
  searchParams,
  searchResultsPromise,
  drawerRef,
}: {
  drawerId: string;
  searchParams: QueryParamData;
  searchResultsPromise: Promise<SearchAPIResponse>;
  drawerRef: RefObject<ModalRef | null>;
}) {
  const t = useTranslations("Search.drawer");
  return (
    <div className="width-full">
      <ModalHeading id={`${drawerId}-heading`}>{t("title")}</ModalHeading>
      <SearchDrawerFilters
        searchParams={searchParams}
        searchResultsPromise={searchResultsPromise}
      />
      <ModalFooter>
        <ModalToggleButton
          modalRef={drawerRef}
          secondary
          className="width-full"
        >
          {t("submit")}
        </ModalToggleButton>
      </ModalFooter>
    </div>
  );
}
