import { useTranslations } from "next-intl";
import React from "react";

import Spinner from "src/components/Spinner";

export default function Loading() {
  const t = useTranslations("Loading");

  return (
    <div className="display-flex flex-align-center flex-justify-center margin-bottom-15 margin-top-15">
      <Spinner />
      <span className="font-body-2xl text-bold margin-left-2">
        {t("search")}...
      </span>
    </div>
  );
}
