"use client";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";

export default function LogoutPage() {
  return (
    <PostAuthRedirect errorMessage="Unable to redirect properly on logout" />
  );
}
