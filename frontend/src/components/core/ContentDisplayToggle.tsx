"use client";

import clsx from "clsx";
import { Breakpoints } from "src/types/uiTypes";

import { useState } from "react";

import { USWDSIcon } from "src/components/core/USWDSIcon";

type ContentDisplayToggleTypes = "default" | "centered";

export default function ContentDisplayToggle({
  hideCallToAction,
  showCallToAction,
  breakpoint,
  showContentByDefault = false,
  positionButtonBelowContent = true,
  type = "default",
  onToggle,
  children,
}: {
  hideCallToAction: string;
  showCallToAction: string;
  breakpoint?: Breakpoints;
  showContentByDefault?: boolean;
  type?: ContentDisplayToggleTypes;
  positionButtonBelowContent?: boolean;
  onToggle?: (visible: boolean) => void;
  children: React.ReactNode;
}) {
  const [toggledContentVisible, setToggledContentVisible] =
    useState<boolean>(showContentByDefault);

  const handleToggle = () => {
    const next = !toggledContentVisible;
    setToggledContentVisible(next);
    onToggle?.(next);
  };

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
          type="button"
          onClick={handleToggle}
          aria-pressed={toggledContentVisible}
          className="usa-button usa-button--unstyled text-no-underline"
        >
          <USWDSIcon name={iconName} className="usa-icon usa-icon--size-4" />
          <span className={clsx(type === "centered" && "text-bold")}>
            {toggledContentVisible ? hideCallToAction : showCallToAction}
          </span>
        </button>
      </div>
      {positionButtonBelowContent && toggledContent}
    </>
  );
}
