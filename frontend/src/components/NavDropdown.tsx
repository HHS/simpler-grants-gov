"use client";

import clsx from "clsx";
import { IndexType } from "src/types/generalTypes";

import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";
import { Menu, NavDropDownButton } from "@trussworks/react-uswds";

interface NavDropdownProps {
  activeNavDropdownIndex: IndexType;
  index: number;
  isCurrent: boolean;
  linkText: string;
  menuItems: JSX.Element[];
  setActiveNavDropdownIndex: Dispatch<SetStateAction<IndexType>>;
}

export default function NavDropdown({
  activeNavDropdownIndex,
  index,
  isCurrent,
  linkText,
  menuItems,
  setActiveNavDropdownIndex,
}: NavDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleToggle() {
    const activeIndex: IndexType = isOpen ? null : index;
    setActiveNavDropdownIndex(activeIndex);
  }

  useEffect(() => {
    setIsOpen(activeNavDropdownIndex === index);
  }, [activeNavDropdownIndex, index]);

  return (
    <>
      <NavDropDownButton
        label={linkText}
        menuId={linkText}
        isOpen={isOpen}
        onToggle={() => handleToggle()}
        className={clsx({
          "usa-current": isCurrent,
          "simpler-subnav-open": isOpen,
        })}
      />
      <Menu
        id={linkText}
        items={menuItems}
        isOpen={isOpen}
        className="margin-top-05"
      />
    </>
  );
}
