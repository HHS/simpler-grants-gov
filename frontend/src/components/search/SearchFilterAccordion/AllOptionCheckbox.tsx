import { difference, uniq } from "lodash";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";
import { isSubset } from "src/utils/generalUtils";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@trussworks/react-uswds";

/*

  AllOptionCheckbox

  * Selecting AllOptionCheckbox selects all child options
  * Deselecting AllOptionCheckbox deselects all child options
  * Will become deselected if any child options are deselected

  Note that this supports two different implementations:

  * either supply topLevelQueryParamKey, topLevelQuery, and topLevelQueryValue
    * this will control selection of filters via a separate "top level" query param such as "topLevelAgency"
  * if these are not supplied, selection will be controlled directly by selection of values on the "queryParamKey"

  Currently only the first implementation is being used. If we decide that the second implementation is not
  needed we can remove support

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
  queryParamKey: ValidSearchQueryParam;
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
    return (
      topLevelQuery &&
      topLevelQueryValue &&
      topLevelQuery.has(topLevelQueryValue)
    );
  }, [topLevelQuery, topLevelQueryValue]);

  const [checked, setChecked] = useState<boolean>(
    topLevelSelected ||
      isSubset<string>(childOptionValues, currentSelectionValues),
  );
  const { setQueryParam, setQueryParams } = useSearchParamUpdater();
  const id = `${title.replace(/\s/, "-").toLowerCase()}-all`;
  const t = useTranslations("Search.accordion");
  const label = `${t("all")} ${title}`;

  useEffect(() => {
    setChecked(
      topLevelSelected ||
        isSubset<string>(childOptionValues, currentSelectionValues),
    );
  }, [childOptionValues, currentSelectionValues, topLevelSelected]);

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
    const newValueTopLevelValue = topLevelQuery
      ? Array.from(topLevelQuery).concat([topLevelQueryValue]).join(",")
      : topLevelQueryValue;
    const newChildValue = difference(
      currentSelectionValues,
      childOptionValues,
    ).join(",");
    setQueryParams([
      [topLevelQueryParamKey, newValueTopLevelValue],
      [queryParamKey, newChildValue],
    ]);
  };

  const uncheckTopLevel = () => {
    if (!topLevelQueryParamKey || !topLevelQueryValue) {
      return;
    }
    const newChildValue = difference(
      currentSelectionValues,
      childOptionValues,
    ).join(",");
    setQueryParams([
      [topLevelQueryParamKey, ""],
      [queryParamKey, newChildValue],
    ]);
  };

  // allows for implementing this via a top level query param, or by updating child values directly via child inputs
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
