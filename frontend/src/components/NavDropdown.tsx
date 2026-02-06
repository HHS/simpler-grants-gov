import clsx from "clsx";
import { last, noop, split, toNumber } from "lodash";
import { IndexType } from "src/types/generalTypes";

import {
  Dispatch,
  JSX,
  MouseEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
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

  // closes all navs unless the click event falls on a currently closed drop down
  // in which case, set that drop down as active
  function closeNavs(e: Event) {
    let targetId = null;
    const dropdowns = document.getElementsByName("navDropDownButton");
    for (const dropdown of dropdowns) {
      if (dropdown.contains(e.target as Node)) {
        let targetNode: HTMLElement = e.target as HTMLElement;
        if (targetNode.localName === "span") {
          targetNode = targetNode.parentNode as HTMLElement;
        }
        if (!targetNode.className.includes("simpler-subnav-open")) {
          const nodeIdParts: Array<string> = split(targetNode.id, "-");
          const dropdownId: number = toNumber(last(nodeIdParts));
          targetId = dropdownId;
        }
        break;
      }
    }
    setActiveNavDropdownIndex(targetId);
  }

  function handleToggle(e: MouseEvent) {
    const activeIndex: IndexType = isOpen ? null : index;
    if (activeIndex) {
      e.stopPropagation();
      requestAnimationFrame(() =>
        document.addEventListener("click", (ev: Event): void => closeNavs(ev), {
          once: true,
        }),
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
        id={`nav-dropdown-button-${index}`}
        name="navDropDownButton"
        label={linkText}
        menuId={linkText}
        isOpen={isOpen}
        onClick={(e) => handleToggle(e)}
        onToggle={noop}
        className={clsx({
          "usa-current": isCurrent,
          "simpler-subnav-open": isOpen,
          "text-bold": true,
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
