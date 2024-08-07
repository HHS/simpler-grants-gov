"use client";
import { Checkbox } from "@trussworks/react-uswds";
import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useContext } from "react";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useTranslations } from "next-intl";

interface StatusOption {
  id: string;
  label: string;
  value: string;
}

interface SearchOpportunityStatusProps {
  query: Set<string>;
}

export default function SearchOpportunityStatus({
  query,
}: SearchOpportunityStatusProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams } = useSearchParamUpdater();

  const handleCheck = (value: string, isChecked: boolean) => {
    const updated = new Set(query);
    isChecked ? updated.add(value) : updated.delete(value);
    updateQueryParams(updated, "status", queryTerm);
  };

  const t = useTranslations("Search");

  const statusOptions: StatusOption[] = [
    {
      id: "status-forecasted",
      label: t("opportunityStatus.label.forecasted"),
      value: "forecasted",
    },
    {
      id: "status-posted",
      label: t("opportunityStatus.label.posted"),
      value: "posted",
    },
    {
      id: "status-closed",
      label: t("opportunityStatus.label.closed"),
      value: "closed",
    },
    {
      id: "status-archived",
      label: t("opportunityStatus.label.archived"),
      value: "archived",
    },
  ];

  return (
    <>
      <h2 className="margin-bottom-1 font-sans-xs">
        {t("opportunityStatus.title")}
      </h2>
      <div className="grid-row flex-wrap">
        {statusOptions.map((option) => {
          return (
            <div key={option.id} className="grid-col-6 padding-right-1">
              <Checkbox
                id={option.id}
                name={option.id}
                label={option.label}
                tile={true}
                onChange={(e) => handleCheck(option.value, e.target.checked)}
                checked={query.has(option.value)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
