import clsx from "clsx";
import { noop } from "lodash";
import { IndexType } from "src/types/generalTypes";

import { Dispatch, JSX, SetStateAction, useEffect } from "react";
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
  let isOpen = activeNavDropdownIndex === index;

  function handleToggle() {
    const activeIndex: IndexType = isOpen ? null : index;
    setActiveNavDropdownIndex(activeIndex);
  }

  useEffect(() => {
    isOpen = activeNavDropdownIndex === index;
  }, [activeNavDropdownIndex, index]);

  return (
    <>
      <NavDropDownButton
        label={linkText}
        menuId={linkText}
        isOpen={isOpen}
        onClick={(e) => {
          handleToggle();
          if (!isOpen) {
            e.stopPropagation();
            requestAnimationFrame(() =>
              document.addEventListener(
                "click",
                () => {
                  isOpen = false;
                },
                { once: true },
              ),
            );
          }
        }}
        onToggle={noop}
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
