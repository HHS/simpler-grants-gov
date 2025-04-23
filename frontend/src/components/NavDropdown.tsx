import clsx from "clsx";
import { noop, toNumber } from "lodash";
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

  function eventHandler(e: any) {
    const dropdowns = document.getElementsByName("navDropDownButton");
    let dropdownClicked = false;
    for (let dropdown of dropdowns) {
      if (dropdown.contains(e.target)) {
        dropdownClicked = true;
      }
    }

    let targetId = null;
    if (dropdownClicked) {
      let targetNode = e.target;
      if (e.target.localName === "span") {
        targetNode = targetNode.parentNode;
      }
      if (!targetNode.className.includes("simpler-subnav-open")) {
        targetId = toNumber(targetNode.id);
      }
    }
    setActiveNavDropdownIndex(targetId);
  }

  function handleToggle(e: any) {
    let activeIndex: IndexType = isOpen ? null : index;
    if (!!activeIndex) {
      e.stopPropagation();
      requestAnimationFrame(() =>
        document.addEventListener(
          "click",
          function (e) {
            eventHandler(e);
          },
          { once: true },
        ),
      );
    }
    setActiveNavDropdownIndex(activeIndex);
  }

  useEffect(() => {
    setIsOpen(activeNavDropdownIndex === index);
  }, [activeNavDropdownIndex, index]);

  return (
    <>
      <NavDropDownButton
        id={index.toString()}
        name="navDropDownButton"
        label={linkText}
        menuId={linkText}
        isOpen={isOpen}
        onClick={function (e: any) {
          handleToggle(e);
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
