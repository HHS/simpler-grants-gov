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
  toggleOnText,
  toggleOffText,
  breakpoint,
  children,
}: {
  toggleOnText: string;
  toggleOffText: string;
  breakpoint?: Breakpoints;
  children: React.ReactNode;
}) {
  const [toggledContentVisible, setToggledContentVisible] =
    useState<boolean>(false);

  const iconName = toggledContentVisible ? "arrow_drop_up" : "arrow_drop_down";

  return (
    <>
      <div
        className={clsx(
          "display-flex",
          "flex-column",
          "flex-align-center",
          breakpoint && `${breakpoint}:display-none`,
        )}
      >
        <div data-testid="content-display-toggle" className="grid-col-4">
          <button
            onClick={(_event) =>
              setToggledContentVisible(!toggledContentVisible)
            }
            aria-pressed={toggledContentVisible}
            className="usa-button usa-button--unstyled text-no-underline"
          >
            <USWDSIcon name={iconName} className="usa-icon usa-icon--size-4" />
            <span className="text-bold">
              {toggledContentVisible ? toggleOnText : toggleOffText}
            </span>
          </button>
        </div>
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
