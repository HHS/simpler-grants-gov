import { noop } from "lodash";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { Checkbox } from "@trussworks/react-uswds";

/*

    AnyOptionCheckbox

    A checkbox that can be used to control the automatic unsetting of all checkboxes within a group

    When the AnyOptionCheckbox is checked:
    * all other checkboxes in the group are unchecked
    * the AnyOptionCheckbox cannot be unchecked by clicking on it
    * the AnyOptionCheckbox will be unchecked whenever another box in the group is checked

    When the AnyOptionCheckbox is unchecked:
    * at least one other checkbox in the group must be checked
    * checking the AnyOptionCheckbox will uncheck any currently checked boxes in the group
      * which will clear or reset the query param controlled by the group

    The optional defaultEmptySelection param can be used to reset the query param to a specific value on
    selection of the AnyOptionCheckbox, rather than clearing it

  */
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
  const label = `${t("any")} ${title}`;

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
