import { LOGIN_URL } from "src/constants/auth";
import { storeCurrentPage } from "src/services/sessionStorage/sessionStorage";

import { PropsWithChildren } from "react";

import { USWDSIcon } from "./USWDSIcon";

export function LoginLink({
  children,
  className,
}: { className?: string } & PropsWithChildren) {
  return (
    <a
      href={LOGIN_URL}
      key="login-link"
      className={className}
      onClick={() => {
        storeCurrentPage();
      }}
    >
      {children}
    </a>
  );
}

export function LoginButton({
  navLoginLinkText,
}: {
  navLoginLinkText: string;
}) {
  return (
    <div className="usa-nav__primary-item border-top-0 height-full">
      <LoginLink
        className="usa-nav__link text-normal font-sans-2xs display-flex flex-align-center height-full"
        data-testid="sign-in-button"
      >
        <USWDSIcon
          className="usa-icon margin-right-105 margin-left-neg-05"
          name="login"
          key="login-link-icon"
        />
        {navLoginLinkText}
      </LoginLink>
    </div>
  );
}
