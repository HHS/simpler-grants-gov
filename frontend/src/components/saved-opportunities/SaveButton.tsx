import clsx from "clsx";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/core/SimplerAlert";
import Spinner from "src/components/core/Spinner";
import { USWDSIcon } from "src/components/core/USWDSIcon";

interface SaveButtonProps {
  // Visually hidden text appended to the button label, e.g. which opportunity is being saved
  accessibleContext?: string;
  buttonClick?: () => void;
  messageClick: () => void;
  // This is the id of the button which will be tied to the aria-describedby of the alert
  buttonId: string;
  defaultText: string;
  error: boolean;
  loading: boolean;
  loadingText: string;
  message: boolean;
  messageText: string | ReactNode;
  saved: boolean;
  savedText: string;
}

const SaveButton = ({
  accessibleContext,
  buttonClick,
  messageClick,
  buttonId,
  defaultText,
  error,
  loading = false,
  loadingText,
  message,
  messageText,
  saved = false,
  savedText,
}: SaveButtonProps) => {
  const text = saved ? savedText : defaultText;
  const type = error ? "error" : "success";
  return (
    <div className="display-flex flex-align-start">
      {/* aria-disabled rather than disabled so keyboard focus stays on the button while the request runs */}
      <Button
        type="button"
        aria-disabled={loading}
        id={buttonId}
        outline
        onClick={loading ? undefined : buttonClick}
        data-testid="simpler-save-button"
      >
        {loading ? (
          <>
            {/* the loading text already describes the state, so keep the spinner out of the button name */}
            <span aria-hidden="true">
              <Spinner className="height-105 width-105 button-icon-large" />
            </span>{" "}
            {loadingText}
            {accessibleContext && (
              <>
                {" "}
                <span className="usa-sr-only">{accessibleContext}</span>
              </>
            )}
          </>
        ) : (
          <>
            <USWDSIcon
              className={clsx("button-icon-large", {
                "icon-active": saved,
              })}
              name={saved ? "star" : "star_outline"}
            />
            {text}
            {accessibleContext && (
              <>
                {" "}
                <span className="usa-sr-only">{accessibleContext}</span>
              </>
            )}
          </>
        )}
      </Button>
      {message && (
        <SimplerAlert
          type={type}
          buttonId={buttonId}
          messageText={messageText}
          alertClick={messageClick}
        />
      )}
    </div>
  );
};

export default SaveButton;
