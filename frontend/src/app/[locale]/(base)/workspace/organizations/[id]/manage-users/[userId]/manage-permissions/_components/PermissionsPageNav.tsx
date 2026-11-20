"use client";

import { MouseEvent } from "react";

interface PermissionsPageNavProps {
  title: string;
  fields: { href: string; text: string }[];
}

// Same markup as LeftHandFormNav. The links scroll to their section instead of
// changing the URL hash: next-navigation-guard throws on the popstate event a
// hash change fires, since that history entry has no state.
export const PermissionsPageNav = ({
  title,
  fields,
}: PermissionsPageNavProps) => {
  const scrollToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: "smooth" });
    section.focus({ preventScroll: true });
  };

  return (
    <aside
      className="usa-in-page-nav maxw-card order-1 margin-left-0 desktop:margin-right-5 overflow-auto"
      aria-label={title}
      data-testid="InPageNavigation"
    >
      <nav className="usa-in-page-nav__nav padding-x-0">
        <h4 className="usa-in-page-nav__heading">{title}</h4>
        <ul className="usa-in-page-nav__list">
          {fields.map(({ href, text }) => (
            <li className="usa-in-page-nav__item" key={href}>
              <a
                className="usa-link usa-in-page-nav__link"
                href={`#${href}`}
                onClick={(event) => scrollToSection(event, href)}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
