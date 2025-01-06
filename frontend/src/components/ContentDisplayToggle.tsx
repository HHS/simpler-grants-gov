"use client";

import clsx from "clsx";
import { Breakpoints } from "src/types/uiTypes";

import { useState } from "react";

import { USWDSIcon } from "src/components/USWDSIcon";

type ContentDisplayToggleTypes = "default" | "centered";

/*
 * ContentDisplayToggle
 *
 * Toggles display of child content
 *
 * @param {string} hideCallToAction - text to show when content is expanded, falls back to showCallToAction if not passed
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
  type = "default",
  children,
}: {
  hideCallToAction?: string;
  showCallToAction: string;
  breakpoint?: Breakpoints;
  showContentByDefault?: boolean;
  type?: ContentDisplayToggleTypes;
  positionButtonBelowContent?: boolean;
  children: React.ReactNode;
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
          type === "centered" && "display-flex",
          type === "centered" && "flex-column",
          type === "centered" && "flex-align-center",
          breakpoint && `${breakpoint}:display-none`,
        )}
      >
        <button
          onClick={(_event) => setToggledContentVisible(!toggledContentVisible)}
          aria-pressed={toggledContentVisible}
          className="usa-button usa-button--unstyled text-no-underline"
        >
          <USWDSIcon name={iconName} className="usa-icon--size-4" />
          <span className={clsx(type === "centered" && "text-bold")}>
            {toggledContentVisible
              ? hideCallToAction || showCallToAction
              : showCallToAction}
          </span>
        </button>
      </div>
      {positionButtonBelowContent && toggledContent}
    </>
  );
}
