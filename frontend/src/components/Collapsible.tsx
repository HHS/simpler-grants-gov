"use client";

import { useEffect, useMemo, useState } from "react";

type CollapsibleProps = {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  /**
   * Duration in (ms) used to delay unmount so exit can animate.
   * Must match your CSS transition duration.
   */
  durationInMs?: number;
  /**
   * If false, children always remain mounted (useful when you need DOM presence).
   */
  unmountOnExit?: boolean;
  /**
   * Optional test id.
   */
  testId?: string;
};

export function Collapsible({
  isOpen,
  children,
  className,
  durationInMs = 300,
  unmountOnExit = true,
  testId,
}: CollapsibleProps): React.ReactElement {
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    if (!unmountOnExit) {
      return;
    }

    const timeoutId: number = window.setTimeout(() => {
      setShouldRender(false);
    }, durationInMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationInMs, isOpen, unmountOnExit]);

  const rootClassName = useMemo(() => {
    const stateClass = isOpen ? "is-expanded" : "is-collapsed";
    return ["collapsible", stateClass, className].filter(Boolean).join(" ");
  }, [className, isOpen]);

  return (
    <div className={rootClassName} aria-hidden={!isOpen} data-testid={testId}>
      <div className="collapsible__inner">{shouldRender ? children : null}</div>
    </div>
  );
}