import clsx from "clsx";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";
import { ButtonProps } from "@trussworks/react-uswds/lib/components/Button/Button";

import Spinner from "./Spinner";
import { USWDSIcon } from "./USWDSIcon";

interface SimplerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  loadingText: string;
  children: string | ReactNode;
  icon?: string;
}

const SimplerButton = ({
  loading = false,
  loadingText,
  children,
  icon,
  ...defaultProps
}: SimplerButtonProps & ButtonProps) => {
  return (
    <Button
      className={clsx("simpler-save-button", {
        loading,
      })}
      disabled={loading}
      outline
      {...defaultProps}
    >
      {loading ? (
        <>
          <Spinner /> {loadingText}
        </>
      ) : (
        <>
          {icon && (
            <>
              <USWDSIcon name={icon} /> {children}
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default SimplerButton;
