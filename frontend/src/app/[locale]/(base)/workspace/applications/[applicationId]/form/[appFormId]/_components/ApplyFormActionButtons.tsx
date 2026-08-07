"use client";

import { useFormStatus } from "react-dom";

import { useRouter } from "next/navigation";
import React, { forwardRef } from "react";
import { Button, ButtonGroup } from "@trussworks/react-uswds";

import { DynamicTooltipWrapper } from "src/components/core/tooltip/TooltipWrapper";

// tooltip trigger that wraps the save button so the tooltip can act on disabled button
const SaveButtonTooltipTrigger = forwardRef<
  HTMLSpanElement,
  React.HTMLProps<HTMLSpanElement>
>((props, ref) => <span {...props} ref={ref} />);

SaveButtonTooltipTrigger.displayName = "SaveButtonTooltipTrigger";

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

  const saveButton = (
    <Button
      data-testid="apply-form-save"
      type="submit"
      name="apply-form-button"
      className="margin-top-05 flex-1"
      value="save"
      onClick={onSaveClick}
      disabled={disableSaveButton}
      // a disabled button swallows mouse events, so let them pass through tothe tooltip trigger wrapping the button
      style={disableSaveButton ? { pointerEvents: "none" } : undefined}
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
        <DynamicTooltipWrapper
          label={saveDisabledTooltipText}
          position="top"
          asCustom={SaveButtonTooltipTrigger}
          wrapperclasses="simpler-tooltip"
        >
          {saveButton}
        </DynamicTooltipWrapper>
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
