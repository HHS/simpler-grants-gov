"use client";

import { postUserEvent } from "src/services/event/postUserEvent";
import { UserEvent } from "src/types/userEventTypes";

type LegacyLinkProps = {
  children: React.ReactNode;
  href: string;
  userEvent: UserEvent;
  className?: string;
};

/**
 * This component can be used for getting insights
 * into users clicking links to the legacy grants.gov system.
 */
const LegacyLink = ({
  children,
  href,
  userEvent,
  className = "",
}: LegacyLinkProps) => {
  const handleClick = () => {
    postUserEvent(userEvent);
  };

  return (
    <a
      className={className}
      href={href}
      onClick={handleClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
};

export default LegacyLink;
