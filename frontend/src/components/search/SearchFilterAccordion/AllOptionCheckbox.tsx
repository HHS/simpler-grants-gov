import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterOption } from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Checkbox } from "@trussworks/react-uswds";

/*

  AllOptionCheckbox

  * Selecting AnyOptionCheckbox selects all child options
  * Deselecting AnyOptionCheckbox deselects all child options
  * Does not respond to child option selections

*/

export const AllOptionCheckbox = ({
  title,
  currentSelections,
  childOptions,
  queryParamKey,
}: {
  title: string;
  currentSelections: Set<string>;
  childOptions: FilterOption[];
  queryParamKey: string;
}) => {
  const [checked, setChecked] = useState<boolean>();
  const { setQueryParam } = useSearchParamUpdater();
  const id = `${title.replace(/\s/, "-").toLowerCase()}-any`;
  const t = useTranslations("Search.accordion");
  const label = `${t("all")} ${title}`;

  const currentSelectionValues = useMemo(
    () => Array.from(currentSelections.values()),
    [currentSelections],
  );
  const childOptionValues = useMemo(
    () => childOptions.map(({ value }) => value),
    [childOptions],
  );

  const uncheckOptions = () => {
    setChecked(false);
    if (!currentSelections) {
      return;
    }
    const newSelectedOptions = currentSelectionValues.filter(
      (currentSelection) => {
        return !childOptionValues.includes(currentSelection);
      },
    );
    setQueryParam(queryParamKey, newSelectedOptions.join(","));
  };

  const checkOptions = () => {
    setChecked(true);
    const newSelectedOptions = childOptionValues.concat(currentSelectionValues);
    setQueryParam(queryParamKey, newSelectedOptions.join(","));
  };

  return (
    <Checkbox
      id={id}
      name={id}
      label={label}
      onChange={checked ? uncheckOptions : checkOptions}
      disabled={false}
      checked={checked}
      value={"all"}
    />
  );
};
