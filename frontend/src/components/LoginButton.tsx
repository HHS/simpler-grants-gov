import { LOGIN_URL } from "src/constants/auth";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { PropsWithChildren } from "react";
import { Button } from "@trussworks/react-uswds";

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
        const startURL = `${location.pathname}${location.search}`;
        if (startURL !== "") {
          SessionStorage.setItem("login-redirect", startURL);
        }
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
    <LoginLink className="padding-0 text-no-underline text-primary-dark display-flex">
      <Button
        type="button"
        className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
        data-testid="sign-in-button"
      >
        <USWDSIcon
          className="usa-icon margin-right-05 margin-left-neg-05"
          name="login"
          key="login-link-icon"
        />
        {navLoginLinkText}
      </Button>
    </LoginLink>
  );
}
