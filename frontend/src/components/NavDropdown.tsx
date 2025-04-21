import {
  Dispatch,
  JSX,
  SetStateAction,
} from "react";

import clsx from "clsx";
import { IndexType } from "src/types/generalTypes";

import {
  Menu,
  NavDropDownButton,
} from "@trussworks/react-uswds";

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
  // const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleToggle() {
    const activeIndex: IndexType = activeNavDropdownIndex ? null : index;
    setActiveNavDropdownIndex(activeIndex);
  }

  // useEffect(() => {
  //   setIsOpen(activeNavDropdownIndex === index);
  // }, [activeNavDropdownIndex, index]);

  return (
    <>
      <NavDropDownButton
        label={linkText}
        menuId={linkText}
        isOpen={activeNavDropdownIndex === null}
        onToggle={() => handleToggle()}
        className={clsx({
          "usa-current": isCurrent,
          "simpler-subnav-open": activeNavDropdownIndex === null,
        })}
      />
      <Menu
        id={linkText}
        items={menuItems}
        isOpen={activeNavDropdownIndex === null}
        className="margin-top-05"
      />
    </>
  );
}
