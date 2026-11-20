import { LOGIN_URL } from "src/constants/auth";
import { postUserEvent } from "src/services/event/postUserEvent";
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
        storeCurrentPage(location.pathname, location.search);
        postUserEvent({
          name: "authentication_initiated",
          properties: { pivRequired: queryParameters?.piv_required === "true" },
        });
      }}
    >
      {children}
    </a>
  );
}
