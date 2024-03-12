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
}

const statusOptions: StatusOption[] = [
  { id: "status-forecasted", label: "Forecasted", value: "forecasted" },
  { id: "status-posted", label: "Posted", value: "posted" },
  { id: "status-closed", label: "Closed", value: "closed" },
  { id: "status-archived", label: "Archived", value: "archived" },
];

// Wait a half-second before updating query params
  // and submitting the form
const SEARCH_OPPORTUNITY_DEBOUNCE_TIME = 500;

const SearchOpportunityStatus: React.FC<SearchOpportunityStatusProps> = ({
  formRef,
}) => {
  const [mounted, setMounted] = useState(false);
  const { updateMultipleParam } = useSearchParamUpdater();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(),
  );


  const debouncedUpdate = useDebouncedCallback(
    (selectedStatuses: Set<string>) => {
      const key = "status";
      updateMultipleParam(selectedStatuses, key);
      formRef?.current?.requestSubmit();
    },
    SEARCH_OPPORTUNITY_DEBOUNCE_TIME,
  );

  const handleCheck = (statusValue: string, isChecked: boolean) => {
    setSelectedStatuses((prevSelectedStatuses) => {
      const updatedStatuses = new Set(prevSelectedStatuses);
      isChecked
        ? updatedStatuses.add(statusValue)
        : updatedStatuses.delete(statusValue);

      if (mounted) {
        debouncedUpdate(updatedStatuses);
      }
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
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default SearchOpportunityStatus;
