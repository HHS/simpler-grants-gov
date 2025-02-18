import clsx from "clsx";

import { ReactNode } from "react";

import { USWDSIcon } from "./USWDSIcon";

interface SimplerAlertProps {
  alertClick: () => void;
  // This is the id which will be tied to the aria-describedby of the alert
  buttonId: string;
  messageText: string | ReactNode;
  type: "error" | "success";
}

const SimplerAlert = ({
  alertClick,
  buttonId,
  messageText,
  type,
}: SimplerAlertProps) => {
  const role = type === "error" ? "alert" : undefined;
  const autofocus = type === "error" ? true : undefined;
  const Wrapper = type === "error" ? "dialog" : "div";
  const open = type === "error" ? true : undefined;
  return (
    <Wrapper
      data-testid="simpler-alert"
      aria-describedby={buttonId}
      role={role}
      open={open}
      autoFocus={autofocus}
      className={clsx(
        `usa-alert usa-alert--${type} usa-alert--slim margin-left-1 margin-y-0 display-inline-block`,
        {
          "usa-alert--no-icon border-0": type === "success",
          "position-relative padding-0 border-top-0 border-right-0 border-bottom-0":
            type === "error",
        },
      )}
    >
      <div
        className={clsx(
          "usa-alert__body padding-bottom-05 padding-top-0 height-5 padding-right-1 flex-row flex-align-center",
          {
            "padding-left-0": type === "success",
          },
        )}
      >
        <div
          className={clsx(
            "usa-alert__heading margin-bottom-0 margin-top-05 font-weight-100",
            {
              "margin-left-2 font-sans-xs": type === "success",
              "margin-left-5 font-sans-sm": type === "error",
            },
          )}
        >
          {messageText}
        </div>
        <button
          data-testid="simpler-alert-close-button"
          type="button"
          className="usa-button usa-button--unstyled font-sans-lg text-black margin-left-2"
          onClick={alertClick}
        >
          <USWDSIcon name="close" />
        </button>
      </div>
    </Wrapper>
  );
};

export default SimplerAlert;
