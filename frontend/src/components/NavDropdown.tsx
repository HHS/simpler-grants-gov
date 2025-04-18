'use client'

import {
  useEffect,
  useState,
} from "react";

import clsx from "clsx";

import {
  Menu,
  NavDropDownButton,
} from "@trussworks/react-uswds";

interface NavDropdownProps {
  activeNavDropdownIndex: number | null;
  setActiveNavDropdownIndex: any;
  index: number;
  isCurrent: boolean;
  linkText: string;
  menuItems: JSX.Element[];
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
    const activeIndex: number | null = isOpen ? null : index;
    setActiveNavDropdownIndex(activeIndex);
  }
  
  useEffect(() => {
    setIsOpen(activeNavDropdownIndex === index);
  }, [activeNavDropdownIndex])

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
  )
}
