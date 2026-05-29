"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { saveBlobToFile } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export function ExportSearchResultsButton({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Search.exportButton");
  const searchParams = useSearchParams();
  const { clientFetch } = useClientFetch<Response>(
    "Unsuccessful csv download",
    { jsonResponse: false },
  );

  const downloadSearchResults = useCallback(() => {
    clientFetch(`/api/search/export?${searchParams.toString()}`)
      .then((response) => {
        return response.blob();
      })
      .then((csvBlob) => {
        return saveBlobToFile(
          csvBlob,
          `grants-search-${getConfiguredDayJs()(new Date()).format("YYYYMMDDHHmm")}.csv`,
        );
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className={className} data-testid="search-download-button-container">
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
