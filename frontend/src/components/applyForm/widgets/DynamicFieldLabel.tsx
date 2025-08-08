"use client";

import React from "react";
import { Label } from "@trussworks/react-uswds";

type DynamicLabelType = "default" | "hide-helper-text";

type DynamicFieldLabelProps = {
  idFor: string;
  title: string | undefined;
  required?: boolean;
  description?: string;
  labelType?: DynamicLabelType;
};

export const DynamicFieldLabel = ({
  idFor,
  title,
  required = false,
  description,
  labelType = "default",
}: DynamicFieldLabelProps) => {
  if (!title) return null;

  const labelContent = (
    <>
      {title}
      {required && (
        <span className="usa-hint usa-hint--required text-no-underline">*</span>
      )}
    </>
  );

  switch (labelType) {
    case "hide-helper-text":
      return (
        <Label htmlFor={idFor} id={`label-for-${idFor}`}>
          {labelContent}
        </Label>
      );

    /* 
    TODO: get design / product approval
    waiting on design approval

    case "with-tooltip":
      return (
        <div className="display-flex flex-align-center">
           <Label htmlFor={idFor} id={`label-for-${idFor}`}>
             {labelContent}
           </Label>
           {description && (
             <Tooltip label="More info" className="margin-left-1">
               {description}
             </Tooltip>
           )}
         </div>
       );
    */

    case "default":
    default:
      return (
        <>
          <Label htmlFor={idFor} id={`label-for-${idFor}`}>
            {labelContent}
          </Label>
          {description && (
            <p className="text-base-dark margin-top-0">{description}</p>
          )}
        </>
      );
  }
};
