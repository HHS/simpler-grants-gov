import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export function ExportSearchResultsButton() {
  const t = useTranslations("Search.exportButton");
  return (
    <div className="flex-justify-start">
      <Button
        outline={true}
        type={"submit"}
        className="width-auto margin-top-2 tablet:width-100 tablet-lg:margin-top-0"
      >
        <USWDSIcon name="file_download" className="usa-icon--size-3" />
        {t("title")}
      </Button>
    </div>
  );
}
