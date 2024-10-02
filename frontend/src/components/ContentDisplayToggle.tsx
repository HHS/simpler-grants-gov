"use client";

import clsx from "clsx";
import { Breakpoints } from "src/types/uiTypes";

import { useState } from "react";

import { USWDSIcon } from "src/components/USWDSIcon";

/*
 * @param {string} breakpoint - used to:
 *  - add a class to toggled content to always display it at viewport sizes above the specified breakpoint
 *  - add a class to toggled button to hide it at viewport sizes above the specified breakpoint
 */
export default function ContentDisplayToggle({
  hideCallToAction,
  showCallToAction,
  breakpoint,
  showContentByDefault = false,
  children,
}: {
  hideCallToAction: string;
  showCallToAction: string;
  breakpoint?: Breakpoints;
  showContentByDefault?: boolean;
  children: React.ReactNode;
}) {
  const [toggledContentVisible, setToggledContentVisible] =
    useState<boolean>(showContentByDefault);

  const iconName = toggledContentVisible ? "arrow_drop_up" : "arrow_drop_down";

  return (
    <>
      <div
        data-testid="content-display-toggle"
        className={clsx(
          "display-flex",
          "flex-column",
          "flex-align-center",
          breakpoint && `${breakpoint}:display-none`,
        )}
      >
        <button
          onClick={(_event) => setToggledContentVisible(!toggledContentVisible)}
          aria-pressed={toggledContentVisible}
          className="usa-button usa-button--unstyled text-no-underline"
        >
          <USWDSIcon name={iconName} className="usa-icon usa-icon--size-4" />
          <span className="text-bold">
            {toggledContentVisible ? hideCallToAction : showCallToAction}
          </span>
        </button>
      </div>
      <div
        className={clsx(
          breakpoint && `${breakpoint}:display-block`,
          !toggledContentVisible && "display-none",
        )}
      >
        {children}
      </div>
    </>
  );
}
