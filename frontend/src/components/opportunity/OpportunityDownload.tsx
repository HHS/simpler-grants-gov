"use client";

import { useTranslations } from "next-intl";
import { Button, Link } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type Props = {
  nofoPath: string;
};

const downloadNOFO = (nofoPath: string) => {
  window.open(nofoPath, "_blank");
};

const OpportunityDownload = ({ nofoPath }: Props) => {
  const t = useTranslations("OpportunityListing.description");

  return (
    <>
      {nofoPath.length > 0 ? (
        <div className="grid-row flex-justify">
          <Button onClick={() => downloadNOFO(nofoPath)} type="button">
            <span>{t("nofo_download")} </span>
            <USWDSIcon
              name={"file_download"}
              className="usa-icon usa-icon--size-4"
            />
          </Button>
          <Link
            className="flex-align-self-center"
            href={"#opportunity_documents"}
          >
            {t("jump_to_documents")}
          </Link>
        </div>
      ) : null}
    </>
  );
};

export default OpportunityDownload;
