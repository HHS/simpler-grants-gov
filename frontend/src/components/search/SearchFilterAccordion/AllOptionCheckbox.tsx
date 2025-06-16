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
  topLevelQueryParamKey,
  topLevelQuery,
  topLevelQueryValue,
}: {
  title: string;
  currentSelections: Set<string>;
  childOptions: FilterOption[];
  queryParamKey: string;
  topLevelQueryParamKey?: string;
  topLevelQuery?: Set<string>;
  topLevelQueryValue?: string;
}) => {
  const currentSelectionValues = useMemo(
    () => Array.from(currentSelections.values()),
    [currentSelections],
  );
  const childOptionValues = useMemo(
    () => (childOptions ? childOptions.map(({ value }) => value) : []),
    [childOptions],
  );

  const topLevelSelected = useMemo(() => {
    return topLevelQuery && topLevelQuery.has(topLevelQueryValue);
  }, [topLevelQuery, topLevelQueryValue]);

  const [checked, setChecked] = useState<boolean>(
    topLevelSelected ||
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

  const checkTopLevel = () => {
    if (!topLevelQueryParamKey || !topLevelQueryValue) {
      return;
    }
    setQueryParam(topLevelQueryParamKey, topLevelQueryValue);
  };
  const uncheckTopLevel = () => {
    if (!topLevelQueryParamKey || !topLevelQueryValue) {
      return;
    }
    setQueryParam(topLevelQueryParamKey, "");
  };

  const handleCheckChange = () => (checked ? uncheckOptions() : checkOptions());
  const handleTopLevelCheckChange = () =>
    checked ? uncheckTopLevel() : checkTopLevel();

  return (
    <Checkbox
      id={id}
      name={id}
      label={label}
      onChange={
        topLevelQueryParamKey ? handleTopLevelCheckChange : handleCheckChange
      }
      disabled={false}
      checked={checked}
      value={"all"}
    />
  );
};
