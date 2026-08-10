"use client";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";

export default function LoginPage() {
  return (
    <PostAuthRedirect
      errorMessage="Unable to redirect properly on login"
      checkPiv={true}
    />
  );
}
