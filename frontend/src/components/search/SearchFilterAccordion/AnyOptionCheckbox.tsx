import { noop } from "lodash";

import { useTranslations } from "next-intl";
import { Checkbox } from "@trussworks/react-uswds";

export const AnyOptionCheckbox = ({
  onAnySelection,
  title,
  checked,
}: {
  onAnySelection: () => void;
  title: string;
  checked: boolean;
}) => {
  const id = `${title}-any`;
  const t = useTranslations("Search.accordion");
  const label = t("any");
  return (
    <Checkbox
      id={id}
      name={id}
      label={label}
      onChange={checked ? noop : onAnySelection}
      disabled={false}
      checked={checked}
      value={"any"}
    />
  );
};
