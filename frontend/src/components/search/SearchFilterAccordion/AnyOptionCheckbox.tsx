import { noop } from "lodash";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { Checkbox } from "@trussworks/react-uswds";

export const AnyOptionCheckbox = ({
  title,
  checked,
  defaultEmptySelection,
  queryParamKey,
}: {
  title: string;
  checked: boolean;
  defaultEmptySelection?: Set<string>;
  queryParamKey: string;
}) => {
  const { setQueryParam } = useSearchParamUpdater();
  const id = `${title.replace(/\s/, "-").toLowerCase()}-any`;
  const t = useTranslations("Search.accordion");
  const label = `${t("any")} ${title.toLowerCase()}`;

  /*
    When checked: remove param for the filter from the query, which will unselect all checkboxes
    When unchecked: this will not happen on any box click. any box will become unchecked whenever another option is checked
  */
  const clearAllOptions = () => {
    const clearedSelections = defaultEmptySelection?.size
      ? Array.from(defaultEmptySelection).join(",")
      : "";
    setQueryParam(queryParamKey, clearedSelections);
  };

  return (
    <Checkbox
      id={id}
      name={id}
      label={label}
      onChange={checked ? noop : clearAllOptions}
      disabled={false}
      checked={checked}
      value={"any"}
    />
  );
};
