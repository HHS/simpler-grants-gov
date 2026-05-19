import clsx from "clsx";

import { useRef, useState } from "react";
import { FileInput, FileInputRef } from "@trussworks/react-uswds";

export function FileUploadPoc({ parentOnChange, resetForm }) {
  const [hideInput, setHideInput] = useState(false);
  const id = "id";
  const fileInputRef = useRef<FileInputRef | null>(null);
  const handleChange = (e) => {
    setHideInput(true);
    parentOnChange(e);
  };
  return (
    <div className={clsx({ "display-none": hideInput })}>
      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        onChange={(e) => handleChange(e)}
      />
    </div>
  );
}
