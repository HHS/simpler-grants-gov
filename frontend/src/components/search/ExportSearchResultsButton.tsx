"use client";

import { useTranslations } from "next-intl";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const getSearchResultsCSV = (searchParams: ReadonlyURLSearchParams) => {
  return fetch(`/api/search/export?${searchParams.toString()}`);
};

export function ExportSearchResultsButton() {
  const t = useTranslations("Search.exportButton");
  const searchParams = useSearchParams();

  const downloadSearchResults = useCallback(() => {
    getSearchResultsCSV(searchParams)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`Unsuccessful csv download. ${response.status}`);
        }
        return response.blob();
      })
      .then((csvBlob) => {
        location.assign(URL.createObjectURL(csvBlob));
      })
      .catch((e) => console.error(e));
  }, [searchParams]);

  return (
    <div className="flex-justify-start">
      <Button
        outline={true}
        type={"submit"}
        className="width-auto margin-top-2 tablet:width-100 tablet-lg:margin-top-0"
        onClick={downloadSearchResults}
      >
        <USWDSIcon name="file_download" className="usa-icon--size-3" />
        {t("title")}
      </Button>
    </div>
  );
}
