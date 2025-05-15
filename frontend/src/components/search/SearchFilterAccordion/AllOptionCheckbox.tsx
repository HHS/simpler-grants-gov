import { uniq } from "lodash";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { isSubset } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@trussworks/react-uswds";

/*

  AllOptionCheckbox

  * Selecting AllOptionCheckbox selects all child options
  * Deselecting AllOptionCheckbox deselects all child options
  * Will become deselected if any child options are deselected

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
  const currentSelectionValues = useMemo(
    () => Array.from(currentSelections.values()),
    [currentSelections],
  );
  const childOptionValues = useMemo(
    () => childOptions.map(({ value }) => value),
    [childOptions],
  );

  const [checked, setChecked] = useState<boolean>(
    isSubset<string>(childOptionValues, currentSelectionValues),
  );
  const { setQueryParam } = useSearchParamUpdater();
  const id = `${title.replace(/\s/, "-").toLowerCase()}-all`;
  const t = useTranslations("Search.accordion");
  const label = `${t("all")} ${title}`;

  useEffect(() => {
    setChecked(isSubset<string>(childOptionValues, currentSelectionValues));
  }, [childOptionValues, currentSelectionValues]);

  const uncheckOptions = () => {
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
    const newSelectedOptions = uniq(
      childOptionValues.concat(currentSelectionValues),
    );
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
