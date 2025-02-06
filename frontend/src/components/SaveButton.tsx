import clsx from "clsx";

import { ReactNode } from "react";

import Spinner from "./Spinner";
import { USWDSIcon } from "./USWDSIcon";

interface SaveButtonProps {
  buttonClick?: () => Promise<void>;
  messageClick: () => void;
  saved: boolean;
  loading: boolean;
  defaultText: string;
  savedText: string;
  loadingText: string;
  error: boolean;
  message: boolean;
  messageText: string | ReactNode;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  buttonClick,
  messageClick,
  defaultText,
  savedText,
  saved = false,
  loading = false,
  loadingText,
  messageText,
  error,
  message,
}) => {
  const text = saved ? savedText : defaultText;
  const type = error ? "error" : "success";
  return (
    <div className="display-flex flex-align-start">
      <button
        data-testId="simpler-save-button"
        className={clsx("simpler-save-button usa-button usa-button--outline", {
          "simpler-save-button--saved": saved,
          "simpler-save-button--loading": loading,
        })}
        onClick={buttonClick}
        disabled={loading}
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
        <div
          data-testid="simpler-save-button-alert"
          className={clsx(
            `usa-alert usa-alert--${type} usa-alert--slim margin-left-1 margin-y-0`,
            {
              "usa-alert--no-icon border-0": !error,
            },
          )}
        >
          <div
            className={clsx(
              "usa-alert__body padding-bottom-05 padding-top-0 height-5 padding-right-1 flex-row flex-align-center",
              {
                "padding-left-0": !error,
              },
            )}
          >
            <div
              className={clsx(
                "usa-alert__heading margin-bottom-0 margin-top-05 font-weight-100",
                {
                  "margin-left-2 font-sans-xs": !error,
                  "margin-left-5 font-sans-sm": error,
                },
              )}
            >
              {messageText}
            </div>
            <button
              data-testid="simpler-save-button-message"
              type="button"
              className="usa-button usa-button--unstyled font-sans-lg text-black margin-left-2"
              onClick={messageClick}
            >
              <USWDSIcon name="close" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveButton;
