import React, { useEffect, useState } from "react";

import { Checkbox } from "@trussworks/react-uswds";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";

interface StatusOption {
  id: string;
  label: string;
  value: string;
}

interface SearchOpportunityStatusProps {
  formRef: React.RefObject<HTMLFormElement>;
  initialStatuses: string;
}

const statusOptions: StatusOption[] = [
  { id: "status-forecasted", label: "Forecasted", value: "forecasted" },
  { id: "status-posted", label: "Posted", value: "posted" },
  { id: "status-closed", label: "Closed", value: "closed" },
  { id: "status-archived", label: "Archived", value: "archived" },
];

// Wait a half-second before updating query params
// and submitting the form
const SEARCH_OPPORTUNITY_STATUS_DEBOUNCE_TIME = 500;

const SearchOpportunityStatus: React.FC<SearchOpportunityStatusProps> = ({
  formRef,
  initialStatuses,
}) => {
  const [mounted, setMounted] = useState(false);
  const { updateQueryParams } = useSearchParamUpdater();

  const initialStatusesSet = new Set(
    initialStatuses ? initialStatuses.split(",") : [],
  );

  const [selectedStatuses, setSelectedStatuses] =
    useState<Set<string>>(initialStatusesSet);

  const debouncedUpdate = useDebouncedCallback(
    (selectedStatuses: Set<string>) => {
      const key = "status";
      updateQueryParams(selectedStatuses, key);
      formRef?.current?.requestSubmit();
    },
    SEARCH_OPPORTUNITY_STATUS_DEBOUNCE_TIME,
  );

  const handleCheck = (statusValue: string, isChecked: boolean) => {
    setSelectedStatuses((prevSelectedStatuses) => {
      const updatedStatuses = new Set(prevSelectedStatuses);
      isChecked
        ? updatedStatuses.add(statusValue)
        : updatedStatuses.delete(statusValue);

      debouncedUpdate(updatedStatuses);
      return updatedStatuses;
    });
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  return (
    <>
      <h4 className="margin-bottom-1">Opportunity status</h4>
      <div className="grid-row flex-wrap">
        {statusOptions.map((option) => (
          <div key={option.id} className="grid-col-6 padding-right-1">
            <Checkbox
              id={option.id}
              name={option.id}
              label={option.label}
              tile={true}
              onChange={(e) => handleCheck(option.value, e.target.checked)}
              disabled={!mounted} // Required to be disabled until hydrated so query params are updated properly
              checked={selectedStatuses.has(option.value)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default SearchOpportunityStatus;
