import clsx from "clsx";

import { ReactNode } from "react";

import SimplerAlert from "./SimplerAlert";
import Spinner from "./Spinner";
import { USWDSIcon } from "./USWDSIcon";

interface SaveButtonProps {
  buttonClick?: () => Promise<void>;
  messageClick: () => void;
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
      <button
        data-testid="simpler-save-button"
        className={clsx("simpler-save-button usa-button usa-button--outline", {
          "simpler-save-button--saved": saved,
          "simpler-save-button--loading": loading,
        })}
        onClick={buttonClick}
        disabled={loading}
        id={buttonId}
      >
        {loading ? (
          <>
            <Spinner /> {loadingText}
          </>
        ) : (
          <>
            <USWDSIcon name={saved ? "star" : "star_outline"} /> {text}
          </>
        )}
      </button>
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
