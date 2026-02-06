import { LOGIN_URL } from "src/constants/auth";
import { storeCurrentPage } from "src/utils/userUtils";

import { PropsWithChildren } from "react";

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
        {navLoginLinkText}
      </LoginLink>
    </div>
  );
}
