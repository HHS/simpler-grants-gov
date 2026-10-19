"use client";

import { PostAuthRedirect } from "src/components/core/PostAuthRedirect";

export default function Login() {
  return (
    <PostAuthRedirect
      errorMessage="Unable to redirect properly on login"
      checkPiv={true}
    />
  );
}
