import { createContext, useContext, type ReactNode } from "react";

/**
 * The level of the page heading above the form's sections. Sections render one level
 * below it, as h4 like `FieldsetWidget`. Change it when the page's heading levels are fixed,
 * and every heading in a JSON Forms form follows.
 */
export const FORM_HEADING_LEVEL = 3;

/** The level of the nearest heading above an element. */
const HeadingLevelContext = createContext(FORM_HEADING_LEVEL);

/** Return the level of the nearest heading above the calling element. */
export const useHeadingLevel = () => useContext(HeadingLevelContext);

/** Set the heading level for everything inside `children`. */
export const HeadingLevel = ({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) => (
  <HeadingLevelContext.Provider value={level}>
    {children}
  </HeadingLevelContext.Provider>
);

/**
 * Render a heading at `level`. HTML stops at h6, so use an ARIA heading for deeper levels.
 */
export const Heading = ({
  level,
  id,
  className,
  children,
}: {
  level: number;
  id?: string;
  className?: string;
  children: ReactNode;
}) => {
  if (level > 6) {
    return (
      <div role="heading" aria-level={level} id={id} className={className}>
        {children}
      </div>
    );
  }
  const Tag = `h${Math.max(level, 1)}` as "h1";
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
};
