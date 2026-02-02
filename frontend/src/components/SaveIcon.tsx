import clsx from "clsx";

import Spinner from "./Spinner";
import { USWDSIcon } from "./USWDSIcon";

interface SaveIconProps {
  onClick?: () => void;
  loading?: boolean;
  saved?: boolean;
  className?: string;
}

const SaveIcon = ({
  onClick,
  loading = false,
  saved = false,
  className,
}: SaveIconProps) => {
  if (loading) {
    return (
      <Spinner
        className={clsx("height-105 width-105 button-icon-large", className)}
      />
    );
  }

  const iconElement = (
    <USWDSIcon
      className={clsx(
        "button-icon-large",
        {
          "icon-active": saved,
        },
        className,
      )}
      name={saved ? "star" : "star_outline"}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="usa-button--unstyled cursor-pointer"
        onClick={onClick}
        aria-label={saved ? "Remove from saved" : "Save opportunity"}
      >
        {iconElement}
      </button>
    );
  }

  return iconElement;
};

export default SaveIcon;
