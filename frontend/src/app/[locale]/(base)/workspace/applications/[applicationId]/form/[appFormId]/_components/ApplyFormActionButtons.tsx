"use client";

import { useFormStatus } from "react-dom";

import { useRouter } from "next/navigation";
import React, { forwardRef } from "react";
import { Button, ButtonGroup } from "@trussworks/react-uswds";

import { TooltipWrapper } from "src/components/core/tooltip/TooltipWrapper";

// tooltip trigger that wraps the save button so the tooltip can act on disabled button
const SaveButtonTooltipTrigger = forwardRef<
  HTMLSpanElement,
  React.HTMLProps<HTMLSpanElement>
>((props, ref) => <span {...props} ref={ref} />);

SaveButtonTooltipTrigger.displayName = "SaveButtonTooltipTrigger";

const SAVE_DISABLED_MESSAGE_ID = "apply-form-save-disabled-message";

type ApplyFormActionButtonsProps = {
  applicationId: string;
  onSaveClick: () => void;
  returnToApplicationText: string;
  savingText: string;
  savingAndRefreshingText: string;
  disableSaveButton: boolean;
  saveDisabledTooltipText: string;
};

const ApplyFormActionButtons = ({
  applicationId,
  onSaveClick,
  returnToApplicationText,
  savingText,
  savingAndRefreshingText,
  disableSaveButton,
  saveDisabledTooltipText,
}: ApplyFormActionButtonsProps) => {
  const { pending } = useFormStatus();
  const router = useRouter();

  const handleReturnToApplication = () => {
    router.push(`/workspace/applications/${applicationId}`);
  };

  // aria-disabled rather than disabled keeps the button focusable, so keyboard
  // users can reach it and trigger the explanatory tooltip.
  const saveButton = (
    <Button
      data-testid="apply-form-save"
      type="submit"
      name="apply-form-button"
      className="margin-top-05 flex-1"
      value="save"
      aria-disabled={disableSaveButton}
      aria-describedby={
        disableSaveButton ? SAVE_DISABLED_MESSAGE_ID : undefined
      }
      onClick={(e) => {
        if (disableSaveButton) {
          e.preventDefault();
          return;
        }
        onSaveClick();
      }}
    >
      {pending ? savingText : savingAndRefreshingText}
    </Button>
  );

  return (
    <ButtonGroup
      className="apply-form__action-buttons display-flex flex-align-center flex-justify"
      style={{ gap: "24px" }}
    >
      {disableSaveButton ? (
        <>
          <TooltipWrapper
            label={saveDisabledTooltipText}
            position="top"
            asCustom={SaveButtonTooltipTrigger}
            wrapperclasses="simpler-tooltip"
          >
            {saveButton}
          </TooltipWrapper>
          {/* the tooltip body is aria-hidden until hovered, so give screen
              readers a stable description of why saving is unavailable */}
          <span id={SAVE_DISABLED_MESSAGE_ID} className="usa-sr-only">
            {saveDisabledTooltipText}
          </span>
        </>
      ) : (
        saveButton
      )}
      <Button
        type="button"
        outline
        className="margin-top-0 flex-1"
        data-testid="apply-form-return"
        onClick={handleReturnToApplication}
      >
        {returnToApplicationText}
      </Button>
    </ButtonGroup>
  );
};

export default ApplyFormActionButtons;
