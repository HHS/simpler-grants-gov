import { LOGIN_URL } from "src/constants/auth";
import { storeCurrentPage } from "src/utils/userUtils";

import { PropsWithChildren } from "react";

export function LoginLink({
  children,
  className,
  queryParameters,
}: {
  className?: string;
  queryParameters?: Record<string, string>;
} & PropsWithChildren) {
  let linkUrl = LOGIN_URL;
  if (queryParameters) {
    linkUrl += `?${new URLSearchParams(queryParameters).toString()}`;
  }
  return (
    <a
      href={linkUrl}
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
