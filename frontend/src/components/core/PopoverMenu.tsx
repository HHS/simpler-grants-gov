"use client";

import { ReactNode, Ref, useEffect, useRef, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

const PopoverTrigger = ({
  buttonRef,
  children,
  handleOnTrigger,
  popoverState,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  children: ReactNode;
  handleOnTrigger: () => void;
  popoverState: boolean;
}) => {
  return (
    <Button
      type="button"
      className="padding-2"
      unstyled
      aria-haspopup="true"
      aria-expanded={popoverState}
      onClick={handleOnTrigger}
      ref={buttonRef}
    >
      {children}
    </Button>
  );
};

export const PopoverMenu = ({ children }: React.PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="position-relative display-inline-block">
      <PopoverTrigger
        buttonRef={buttonRef}
        handleOnTrigger={() => setOpen(!open)}
        popoverState={open}
      >
        <USWDSIcon name="more_horiz" className="button-icon-md" />
      </PopoverTrigger>

      {open && (
        <div
          className="border border-base-light bg-white shadow-2 radius-md padding-1 text-no-wrap position-absolute z-top top-full right-0"
          role="menu"
          ref={menuRef}
        >
          {children}
        </div>
      )}
    </div>
  );
};
