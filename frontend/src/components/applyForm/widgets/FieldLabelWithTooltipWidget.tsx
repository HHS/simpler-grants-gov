"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@trussworks/react-uswds";

interface FieldLabelWithTooltipProps {
  htmlFor: string;
  label: string;
  tooltip?: string;
  required?: boolean;
}

export const FieldLabelWithTooltip: React.FC<FieldLabelWithTooltipProps> = ({
  htmlFor,
  label,
  tooltip,
  required = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = `${htmlFor}-tooltip`;
  const tooltipStyles = { anchorName: `--anchor-${htmlFor}-tooltip`} as React.CSSProperties

  // Handle outside click to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipPinned &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setShowTooltip(false);
        setTooltipPinned(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tooltipPinned]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowTooltip(false);
        setTooltipPinned(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="usa-label-wrapper display-flex flex-align-center position-relative"
      onMouseEnter={() => {
        if (!tooltipPinned) setShowTooltip(true);
      }}
      onMouseLeave={() => {
        if (!tooltipPinned) setShowTooltip(false);
      }}
    >
      <label className="usa-label margin-right-1" htmlFor={htmlFor}>
        {label}
        {required && (
          <abbr title="required" className="usa-hint usa-hint--required">
            *
          </abbr>
        )}
      </label>

      {tooltip && (
        <>
          <button
            ref={buttonRef}
            type="button"
            className="usa-button usa-button--unstyled margin-left-05"
            aria-describedby={tooltipId}
            aria-expanded={showTooltip}
            onClick={() => {
              setTooltipPinned((prev) => {
                const pinned = !prev;
                setShowTooltip(pinned);
                return pinned;
              });
            }}
            style={ tooltipStyles }
          >
            <Icon.Info
              size={3}
              className="text-middle"
              aria-hidden="true"
            />
            <span className="usa-sr-only">More information about {label}</span>
          </button>

          {showTooltip && (
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="tooltip-box bg-white text-black padding-1 border border-base-lighter radius-md shadow-lg"
              style={{
                positionAnchor: `--anchor-${htmlFor}-tooltip`,
                position: "absolute",
                bottom: 'anchor(top)',
                left:' anchor(left)',
                maxWidth: "20rem",
                zIndex: 2000,
                fontSize: "0.875rem",
              } as React.CSSProperties }
            >
              {tooltip}
            </div>
          )}
        </>
      )}
    </div>
  );
};
