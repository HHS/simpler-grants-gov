import React, { useMemo } from "react";

const ApplyFormNav = ({
  fields,
}: {
  fields: { href: string; text: string }[];
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
        className="usa-in-page-nav top-3 width-mobile maxw-none"
        aria-label="On this form"
        data-testid="InPageNavigation"
      >
        <nav className="usa-in-page-nav__nav">
          <h4 className="usa-in-page-nav__heading" tabIndex={0}>
            On this form
          </h4>
          <ul className="usa-in-page-nav__list">{Links}</ul>
        </nav>
      </aside>
    )
  );
};

export default ApplyFormNav;
