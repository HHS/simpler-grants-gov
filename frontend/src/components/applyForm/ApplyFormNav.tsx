import React, { useMemo } from "react";

const ApplyFormNav = ({
  fields,
  title,
}: {
  fields: { href: string; text: string }[];
  title: string;
}) => {
  const Links = useMemo(
    () =>
      fields.map(({ text, href }) => (
        <li className="usa-in-page-nav__item" key={text}>
          <a className="usa-link usa-in-page-nav__link" href={`#${href}`}>
            {text}
          </a>
        </li>
      )),
    [fields],
  );
  return (
    fields.length > 0 && (
      <aside
        className="usa-in-page-nav maxw-card order-1 margin-left-0 desktop:margin-right-5 overflow-auto"
        aria-label={title}
        data-testid="InPageNavigation"
      >
        <nav className="usa-in-page-nav__nav padding-x-0">
          <h4 className="usa-in-page-nav__heading" tabIndex={0}>
            {title}
          </h4>
          <ul className="usa-in-page-nav__list">{Links}</ul>
        </nav>
      </aside>
    )
  );
};

export default ApplyFormNav;
