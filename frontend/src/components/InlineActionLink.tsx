"use client";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

type InlineActionLinkProps = {
  onClick: () => void;
  children: ReactNode;
};

export const InlineActionLink = ({
  onClick,
  children,
}: InlineActionLinkProps) => {
  return (
    <Button type="button" onClick={onClick} className="text-underline" unstyled>
      {children}
    </Button>
  );
};
