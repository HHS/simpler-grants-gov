import React from "react";

import Link from "next/link";

interface NavLinkProps {
  href?: string;
  classes?: string;
  onClick: () => void;
  text: string;
}

const NavLink = ({
  href = "",
  classes,
  onClick,
  text,
}: NavLinkProps): JSX.Element => {
  return (
    <Link href={href} key={href} className={classes}>
      <div onClick={onClick}>{text}</div>
    </Link>
  );
};

export default NavLink;