import clsx from "clsx";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import SimplerAlert from "./SimplerAlert";
import Spinner from "./Spinner";
import { USWDSIcon } from "./USWDSIcon";

interface SaveButtonProps {
  buttonClick?: (() => Promise<void>) | (() => void);
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
      <Button
        type="button"
        disabled={loading}
        id={buttonId}
        outline
        onClick={buttonClick}
        data-testid="simpler-save-button"
      >
        {loading ? (
          <>
            <Spinner className="height-105 width-105 button-icon-large" />{" "}
            {loadingText}
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
