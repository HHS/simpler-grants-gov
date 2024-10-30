"use client";

import clsx from "clsx";
import { Breakpoints } from "src/types/uiTypes";

import { useState } from "react";

import { USWDSIcon } from "src/components/USWDSIcon";

/*
 * ContentDisplayToggle
 *
 * Toggles display of child content
 *
 * @param {string} breakpoint - used to:
 *  - add a class to toggled content to always display it at viewport sizes above the specified breakpoint
 *  - add a class to toggled button to hide it at viewport sizes above the specified breakpoint
 *  @param {boolean} positionButtonBelowContent - defines whether toggle button will appear below or above child content
 */
export default function ContentDisplayToggle({
  hideCallToAction,
  showCallToAction,
  breakpoint,
  showContentByDefault = false,
  positionButtonBelowContent = true,
  children,
}: {
  hideCallToAction: string;
  showCallToAction: string;
  breakpoint?: Breakpoints;
  showContentByDefault?: boolean;
  children: React.ReactNode;
  positionButtonBelowContent?: boolean;
}) {
  const [toggledContentVisible, setToggledContentVisible] =
    useState<boolean>(showContentByDefault);

  const iconName = toggledContentVisible ? "arrow_drop_up" : "arrow_drop_down";

  const toggledContent = (
    <div
      data-testid="toggled-content-container"
      className={clsx(
        breakpoint && `${breakpoint}:display-block`,
        !toggledContentVisible && "display-none",
      )}
    >
      {children}
    </div>
  );

  return (
    <>
      {!positionButtonBelowContent && toggledContent}
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
      {positionButtonBelowContent && toggledContent}
    </>
  );
}
